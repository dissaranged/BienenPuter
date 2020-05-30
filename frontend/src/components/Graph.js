import React, {Component} from 'react';
import {Row, Col, Card, CardBody, CardHeader} from 'reactstrap';
import { Graph2d } from 'vis-timeline/standalone';
import Legend from './Legend';

const unit = {
  temperature: 'temperature in °C',
  humidity: 'humidity in %',
};


export default class Graph extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  state = {
    graph: null,
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
          title: {text: unit[type]}
        }
      },
      height: 400,
    };

    const graph = new Graph2d(this.ref.current, dataset, groups, opts);
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

  render() {
    const {type} = this.props;
    const { graph } = this.state;
    return (
      <Col sm="12">
        <Card>
          <CardHeader>
            <Row>
              <Col sm="3"><h2>{type}</h2></Col>
              <Col><Legend groups={this.props.groups} graph={graph}/></Col>
            </Row>
          </CardHeader>
          <CardBody>
            <div ref={this.ref}/>
          </CardBody>
        </Card>
      </Col>
    );
  }
}
