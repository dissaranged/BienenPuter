import React, {Component} from 'react';
import { DataSet } from 'vis-timeline/standalone';
import deepEqual from 'fast-deep-equal';
import { getReadings } from '../actions';

import { Container, Row, Button } from 'reactstrap';
import Graph from './Graph';

function FtoC (f) {
  return (f - 32) * 5 / 9;
}


class GraphsWrapper extends Component {
  state =  {
    devices: {},
    data: {
      temperature: new DataSet(),
      humidity: new DataSet(),
    },
    groups: new DataSet(),
    autoUpdate: 10,
    goFetch: false,
  };
  static getDerivedStateFromProps(props, state) {
    const devices = props.devices.filter(({subscribed}) => subscribed).reduce((acc, data) => ({
      ...acc,
      [data.key]: data,
    }), {});
    if(deepEqual(devices, state.devices)) {
      return null;
    }
    return {
      devices,
      goFetch: true,
    };
  }

  componentDidUpdate( prevProps, prevState) {
    if(this.state.goFetch) {
      this.loadReadings();
    }
  }

  handleReading = (sample) => {
    const {time, key, temperature_C, temperature_F, humidity} = sample;
    const item = { x: new Date(time), group: key };
    const temp = temperature_C || (temperature_F ? FtoC(temperature_F) : null);
    if (!temp && !humidity) {
      console.log(`Bad Reading for ${key}: `, sample);
      return;
    }
    if (temp) { this.state.data.temperature.add({ ...item, y: temp }); }
    if (humidity) { this.state.data.humidity.add({ ...item, y: humidity }); }
  }

  async  loadReadings() {
    const {devices, groups} = this.state;
    const readings = (await Promise.all(Object.keys(devices).map( device => getReadings(device)))).filter(list => list.length > 0);
    readings.forEach((device) => {
      const { key } = device[0];
      const color = devices[key].color || `#$${Math.floor(Math.random()*0xffffff).toString(16)}`;
      const alias = devices[key].alias || key;
      groups.add( {
        id: key,
        content: alias,
        style: `stroke:${color};fill:${color}`,
        options: {
          drawPoints: { styles: `stroke:${color};fill:${color}` }
        }
      });
    });
    readings.forEach(device => device.forEach(this.handleReading));
    this.setState({goFetch: false, lastUpdate: Math.floor(Date.now()/1000)});
  }
  
  updateReadings = async () => {
    const { lastUpdate: since, devices, autoUpdate } = this.state;
    const readings = await Promise.all(
      Object.keys(devices).map( device => getReadings(device, { since }) )
    );
    readings.forEach( device => device.forEach(this.handleReading));
    console.log(readings.reduce( (sum, i) => sum+=i.length, 0), ' new items since ', new Date(since* 1000));
    this.setState({lastUpdate: Math.floor(Date.now()/1000)});
    if(autoUpdate){
      setTimeout(this.updateReadings, 1000*autoUpdate);
    }
  }

  render() {
    const { data, groups } = this.state;
    return (
      <Container>
        <h1>Graphs</h1>
        <Row>
          {Object.keys(data).length > 0 ? Object.entries(data).map( ([type, dataset]) => (
            <Graph key={type} type={type} groups={groups} dataset={dataset}/>
          )) : ( <em>Nothing to see :(</em> ) }
        </Row>
        <Button onClick={this.updateReadings}>Update!</Button>
      </Container>
    );
  }
  }


export default GraphsWrapper;
