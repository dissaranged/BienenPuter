import React, {Component} from 'react';
import { Graph2d } from 'vis-timeline/standalone';
import Legend from './Legend';
import { Button } from '@blueprintjs/core';

const unit = {
  temperature: 'temperature in °C',
  humidity: 'humidity in %',
};

const range = {
  temperature: { min: -50, max: 80 },
  humidity: { min: 0, max: 100 },
};

export default class Graph extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  state = {
    graph: null,
    locked: false,
  }

  componentDidMount() {
    const { groups, dataset, type, window: {start, end} } = this.props;
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
      start, end
    };
    const graph = new Graph2d(this.ref.current, dataset, groups, opts);
    graph.on('rangechanged', this.handleRangeChanged);
    graph.on('click', console.log);
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

    this.setState({graph});
  }

  componentWillReceiveProps(props) {
    if((this.props.window.end !== props.window.end ||
       this.props.window.start !== props.window.start) && this.state.graph && this.state.locked) {
      this.state.graph.setWindow(props.window.start, props.window.end);
    }
  }

  componentWillUnmount() {
    this.state.graph.off('rangechanged', this.handleRangeChanged);
  }

  render() {
    const { type } = this.props;
    const { graph, locked } = this.state;
    return (
      <div className="graph">
        <div className="header">
          <div className="title">{type}</div>
          <div>
            <Button
              style={{float: 'right'}}
              title="Linked"
              icon={locked ? 'lock' : 'unlock'}
              onClick={this.handleLock}
            />
            <Button
              style={{float: 'right'}}
              title="Fit"
              icon="zoom-to-fit"
              onClick={this.handleFit}
            />
            <Legend groups={this.props.groups} graph={graph} />
          </div>
        </div>
        <div ref={this.ref} />
      </div>
    );
  }

  handleRangeChanged = (event) => {
    console.log('range changed', event);
    const {locked} = this.state;
    this.props.onRangeChange(event);
    if(locked) {
      this.props.onWindowChange(event);
    }
  }

  handleFit = () => {
    this.state.graph.fit();
  }

  handleLock = () => {
    const { locked } = this.state;
    this.setState({locked:!locked});
  }
}
