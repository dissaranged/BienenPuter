import React, {Component} from 'react';
import { DataSet } from 'vis-timeline/standalone';
import deepEqual from 'fast-deep-equal';
import { getReadings } from '../actions';

import { Container, Row, Col, Input, Label } from 'reactstrap';
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

  handleReadings = (readings) => {
    const data = {temperature: [], humidity: []};
    readings.forEach( sample => {
      const {time, key, temperature_C, temperature_F, humidity} = sample;
      const item = { x: new Date(time), group: key };
      const temp = temperature_C || (temperature_F ? FtoC(temperature_F) : null);
      if (!temp && !humidity) {
        console.log(`Bad Reading for ${key}: `, sample);
        return;
      }
      if (temp) { data.temperature.push({ ...item, y: temp }); }
      if (humidity) { data.humidity.push({ ...item, y: humidity }); }
    });
    this.state.data.temperature.add(data.temperature);
    this.state.data.humidity.add(data.humidity);
    return readings;
  }

  async  loadReadings() {
    const {devices, groups} = this.state;
    const existing = groups.clear();
    Object.keys(devices).forEach((key) => {
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
    this.setState({goFetch: false, lastUpdate: Math.floor(Date.now()/1000)});
    await Promise.all(
      Object.keys(devices)
        .filter(device => !existing.includes(device))
        .map( device => getReadings(device).then(this.handleReadings))
    );
    this.doAutoUpdate();
  }

  updateReadings = async () => {
    const { lastUpdate: since, devices } = this.state;
    this.setState({lastUpdate: Math.floor(Date.now()/1000)});
    const readings = await Promise.all(
      Object.keys(devices).map(
        device => getReadings(device, { since }).then(this.handleReadings)
      )
    );
    console.log(readings.reduce( (sum, i) => sum+=i.length, 0), ' new items since ', new Date(since* 1000));
    this.doAutoUpdate();
  }

  doAutoUpdate = async () => {
    const { autoUpdate, timeout} = this.state;
    clearTimeout(timeout);
    if(autoUpdate) {
      const newTimeout = setTimeout(this.updateReadings, 1000*autoUpdate);
      this.setState({timeout: newTimeout});
    }
  }

  toggleAutoUpdate = () =>  this.setState({
    autoUpdate: this.state.autoUpdate ? 0 : 10
  }, this.doAutoUpdate);

  render() {
    const { data, groups, autoUpdate } = this.state;
    return (
      <Col>
        <Row >
          <Col sm="8" ><h3>Graphs </h3></Col>
          <Col sm={{ size: 1, offset: 1}} >
            <Label>
              <Input type="checkbox" onChange={this.toggleAutoUpdate} checked={!!autoUpdate}/>Update!
            </Label>
          </Col>
        </Row>
        <Row>
          {Object.keys(data).length > 0 ? Object.entries(data).map( ([type, dataset]) => (
            <Graph key={type} type={type} groups={groups} dataset={dataset}/>
          )) : ( <em>Nothing to see :(</em> ) }
        </Row>
      </Col>
    );
  }
  }


export default GraphsWrapper;
