import React, {Component} from 'react';
import { DataSet } from 'vis-timeline/standalone';
import deepEqual from 'fast-deep-equal';
import { getReadings } from '../actions';
import moment from 'moment';
import Graph from './Graph';

import { H4, Button, Tooltip, Spinner, ProgressBar } from "@blueprintjs/core";

function FtoC (f) {
  return (f - 32) * 5 / 9;
}

function toTS(date) {
  return Math.floor(Date.parse(date)/1000);
}

class GraphsWrapper extends Component {
  state =  {
    devices: {},
    data: {
      temperature: new DataSet(),
      humidity: new DataSet(),
    },
    groups: new DataSet(),
    window: { start: new Date(Date.now()-1000*60), end: new Date()},
    range: { start: new Date(Date.now()-1000*60), end: new Date()},
    autoUpdate: 0, // disabled
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
      this.createGroups();
    }
  }

  handleRawReadings = (readings) => {
    const data = {temperature: [], humidity: []};
    readings.forEach( sample => {
      const {time, key, temperature_C, temperature_F, humidity} = sample;
      const item = { x: moment(time), group: key };
      const temp = temperature_C || (temperature_F ? FtoC(temperature_F) : null);
      if (typeof temp === 'undefined'  && typeof humidity === 'undefined') {
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


  handleReadings = (key, readings) => {
    // const data = {temperature: [], humidity: []};
    const temperatures = [];
    const humidities = [];
    readings.forEach( sample => {
      const {time, temperature_C, humidity, temperature_F} = sample;
      const x = moment(time);
      if (typeof temperature_C !== 'undefined') {
        temperatures.push({ x, y: temperature_C.average, group: key},
                          {x, y: temperature_C.min, group: `min-${key}`},
                          {x, y: temperature_C.max, group: `max-${key}`});
      } else if (typeof temperature_F  !== 'undefined') {
        temperatures.push({x, y: FtoC(temperature_F.average), group: key},
                          {x, y: FtoC(temperature_F.min), group: `min-${key}`},
                          {x, y: FtoC(temperature_F.max), group: `max-${key}`});
      }
      if (typeof humidity  !== 'undefined') {
        humidities.push({x, y: humidity.average, group: key},
                        {x, y: humidity.min, group: `min-${key}`},
                        {x, y: humidity.max, group: `max-${key}`});

      }
    });
    this.state.data.temperature.add(temperatures);
    this.state.data.humidity.add(humidities);

    return readings;
  }

  async  createGroups() {
    const {devices, groups} = this.state;
    const existing = groups.clear();
    const newGroups = [];
    Object.keys(devices).forEach((key) => {
      const color = devices[key].color || `#${Math.floor(Math.random()*0xeeeeee).toString(16).padStart(6,'0')}`;
      const [r,g,b] = color.match(/#(..)(..)(..)/).slice(1).map( c => parseInt(c, 16));
      function rgb(r,g,b) { return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`}
      function darken(c) { return Math.floor( parseInt(c,16) * 0.9 ).toString(16).padStart(2,'0'); }
      const darkerColor = `#${darken(r)}${darken(g)}${darken(b)}`;
      const alias = devices[key].alias || key;
      newGroups.push(
        {
          id: `max-${key}`,
          content: `MAX-${key}`,
          style: 'stroke-width:0px',
          options: {
            excludeFromLegend: true,
            shaded: { orientation: 'group', groupId: key, style: `fill:${rgb((r +64) %255,g,b)}`},
            drawPoints: false,
          }
        }, {
          id: key,
          content: alias,
          style: `stroke:${color};fill:${color}`,
          options: {
            drawPoints: { styles: `stroke:${darkerColor};fill:${rgb(r*0.9,g*0.9,b*0.9)}` }
          }
        }, {
          id: `min-${key}`,
          content: `MIN-${key}`,
          style: 'stroke-width:0px',
          options: {
            excludeFromLegend: true,
            shaded: { orientation: 'group', groupId: key, style: `fill:${rgb(r,(g +64) %255,b)}` },
            drawPoints: false,
          }
        }
      );
    });
    groups.add(newGroups);
    this.setState({goFetch: false, lastUpdate: Math.floor(Date.now()/1000)});
    const {start, end} = this.state.range;
    await Promise.all(
      Object.keys(devices)
        .filter(device => !existing.includes(device))
        .map( async device => {
          const readings = await getReadings(device, {type: '6m', perPage: -1, since: toTS(start), until: toTS(end)});
          this.handleReadings(device, readings);
        })
    );
    this.doAutoUpdate();
  }

  loadReadings = async (options) => {
    const {devices} = this.state;
    const toastKey = this.props.toaster.show({ icon: 'cloud-update', message: <ProgressBar />, timeout: 0 });
    await Promise.all(
      Object.keys(devices)
        .map( async device => {
          const readings = await getReadings(device, {...options, type: '6m'});
          this.handleReadings(device, readings);
        })
    );
    this.props.toaster.dismiss(toastKey);
  }

  updateReadings = async () => {
    const { lastUpdate: since, devices } = this.state;
    this.setState({lastUpdate: Math.floor(Date.now()/1000), refreshInProgress: true});
    const readings = await Promise.all(
      Object.keys(devices).map(
        device => getReadings(device, { since}).then(this.handleRawReadings)
      )
    );
    console.log(readings.reduce( (sum, i) => sum+=i.length, 0), ' new items since ', new Date(since* 1000));
    this.setState({refreshInProgress: false});
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
    const { data, groups, autoUpdate, globalStart, window, range, refreshInProgress } = this.state;
    return (
      <div className="graph-wrapper">
        <div className="header">
          <H4>Graphs</H4>
          <div className="controls">
            <Tooltip
              content="When enabled, automatically refreshes graph data periodically"
            >
              <Button
                active={!!autoUpdate}
                icon={refreshInProgress ? <Spinner size={Spinner.SIZE_SMALL} /> : "automatic-updates"}
                onClick={this.toggleAutoUpdate}
              >
                {autoUpdate ? 'Updates automatically' : 'Enable automatic update'}
              </Button>
            </Tooltip>
          </div>
        </div>
        <div className="content">
          {Object.keys(data).length > 0 ? Object.entries(data).map( ([type, dataset]) => (
            <Graph key={type} type={type} groups={groups} dataset={dataset} loadReadings={this.loadReadings} windowStart={globalStart} window={window} range={range} onWindowChange={this.handleWindowChange} onRangeChange={this.handleRangeChange}/>
          )) : ( <em>Nothing to see here</em> ) }
        </div>
      </div>
    );
  }

  handleWindowChange = ({end, start}) => {
    this.setState({window :{start, end}});
  }

  handleRangeChange = ({end, start}) => {
    const {range: {start: oldStart, end: oldEnd}} = this.state;
    this.setState({range: {start: start < oldStart ? start : oldStart, end: end > oldEnd ? end : oldEnd}});
    if(start < oldStart) {
      this.loadReadings({
        since: toTS(start),
        until: toTS(oldStart),
        perPage: -1
      });
    }
    if(end > oldEnd) {
      this.loadReadings({
        since: toTS(end),
        until: toTS(oldEnd),
        perPage: -1
      });
    }
  }

}


export default GraphsWrapper;
