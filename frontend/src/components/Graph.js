import React, {Component} from 'react';
import { Graph2d } from 'vis-timeline/standalone';
import Legend from './Legend';
import { Button, Slider, Tooltip, Position, Spinner } from '@blueprintjs/core';

const unit = {
  temperature: 'temperature in °C',
  humidity: 'humidity in %',
};

const range = {
  temperature: { min: -50, max: 80 },
  humidity: { min: 0, max: 100 },
};

const DEFAULT_NUMBER_OF_POINTS = 100;

export default class Graph extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  state = {
    graph: null,
    locked: false,
    since: null,
    until: null,
    numberOfPoints: DEFAULT_NUMBER_OF_POINTS,
  }

  componentDidMount() {
    const { groups, dataset, type } = this.props;
    const opts = {
      defaultGroup: 'ungrouped',
      legend: false,
      drawPoints: {
        style: 'circle',
        size: 3
      },
      dataAxis: {
        showMinorLabels: true,
        left : {
          title: {text: unit[type]},
          range: range[type],
        },
      },
      clickToUse: true,
      height: 400,
    };
    const graph = new Graph2d(this.ref.current, dataset, groups, opts);

    graph.on('rangechanged', this.handleRangeChanged);

    this.setState({
      since: Date.now()-48*3600*1000,
      until: Date.now(),
      graph,
    }, this.updateData);
    // SUCKS BAD
    // let height = 400;
    // this.ref.current.addEventListener('wheel', (e) => {
    //   e.preventDefault();
    //   const event = graph.getEventProperties(e);
    //   console.log(event);
    //   window.graph = graph
    //   if(event.what === 'data-axis') {
    //     height+=e.deltaY
    //     graph.setOptions({graphHeight: height});
    //   }
    // });
  }

  componentWillReceiveProps(props) {
    if (this.state.graph) {
      if (this.props.windowEnd !== props.windowEnd || this.props.windowStart !== props.windowStart) {
        this.state.graph.setWindow(props.windowStart, props.windowEnd);
      }
      if (this.props.measurements !== props.measurements) {
        console.log(props.measurements)
        const items = Object.entries(props.measurements).reduce((acc, [device, data]) => {
          if(!data) {
            return acc;
          }
          return data.reduce((acc, {time, min, max, avg}) =>
          [ ...acc,
            { x: time, y: min, group: `${device}-min` },
            { x: time, y: max, group: `${device}-max` },
            { x: time, y: avg, group: `${device}-mean` },
          ], acc);
        }, []);
        console.log('items', items)
        this.state.graph.setItems(items);
        this.setState({ loading: false });
      }
    }
  }

  componentWillUnmount() {
    this.state.graph.off('rangechanged', this.handleRangeChanged);
  }

  rangePerPoint() {
    const since = new Date(this.state.since);
    const until = new Date(this.state.until);
    const window = Math.floor((until.getTime() - since.getTime()) / (this.state.numberOfPoints * 1000));
    if (window < 60) {
      return `~${Math.max(1, Math.round(window))}s`;
    } else if (window < 3600) {
      return `~${Math.round(window / 60)}m`;
    } else {
      return `~${Math.round(window / 3600)}h`;
    }
  }

  render() {
    const {type} = this.props;
    const { graph, locked, numberOfPoints, loading } = this.state;
    return (
      <div className="graph">
        <div className="header">
          <div className="title">
            {type}
          </div>
          <div>
            <div style={{float: 'right'}}>
              <div style={{width: '10em', minWidth: '170px', display: 'inline-block'}}>
                <Tooltip content={`Number of samples: ${Math.round(numberOfPoints)} (${this.rangePerPoint()} per point)`}
                         position={Position.BOTTOM}>
                  <Slider
                    value={Math.log10(numberOfPoints)}
                    min={0}
                    max={3}
                    onChange={value => this.handleNumberOfPointsChange(Math.pow(10, value))}
                    onRelease={this.updateData}
                    labelRenderer={false}
                    stepSize={0.1}
                    showTrackFill={true}
                  />
                </Tooltip>
              </div>
              <Button
                title="Linked"
                icon={locked ? 'lock' : 'unlock'}
                active={locked}
                onClick={this.handleLock}
              />
              <Button
                title="Fit"
                icon="zoom-to-fit"
                onClick={this.handleFit}
              />
            </div>
            <Legend groups={this.props.groups} graph={graph} />
          </div>
        </div>
        <div ref={this.ref} />
      </div>
    );
  }

  handleRangeChanged = (event) => {
    console.log('range changed', event);
    this.setState({
      since: event.start,
      until: event.end,
    }, this.updateData);
    if (this.state.locked) {
      this.props.onGlobalRangeChange(event);
    }
  }

  handleNumberOfPointsChange = numberOfPoints => {
    this.setState({ numberOfPoints });
  }

  updateData = () => {
    const since = new Date(this.state.since);
    const until = new Date(this.state.until);
    const window = Math.max(1, Math.floor((until.getTime() - since.getTime()) / (this.state.numberOfPoints * 1000)));
    this.setState({ loading: true });
    this.props.getMeasurements({
      // Actually requesting one "window" more on each side than the visible range,
      // so that the curve is not cut off before the edge of the view,
      // unless there is really no more data in that direction:
      since: new Date(since.getTime() - window * 1000),
      until: new Date(until.getTime() + window * 1000),
      window: `${window}s`,
      field: this.props.type === 'temperature' ? 'temperature_C' : this.props.type,
    });
  }

  handleFit = () => {
    this.state.graph.fit();
  }

  handleLock = () => {
    const { locked } = this.state;
    this.setState({locked:!locked});
  }
}
