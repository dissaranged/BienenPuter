import React, {Component} from 'react';
import {Col, Card, CardBody, CardHeader} from 'reactstrap';
import { Graph2d } from 'vis-timeline/standalone';

export default class Graph extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();

  }
  componentDidMount() {
    const { groups, dataset } = this.props;
    const opts = {
      defaultGroup: 'ungrouped',
      legend: true,
      drawPoints: {
        style: 'circle', // square, circle
        size: 3
      },
      dataAxis: {
        showMinorLabels: true
      }
    };

    const graph = new Graph2d(this.ref.current, dataset, groups, opts)
    console.log(graph)
  }
  render() {
    const {type} = this.props;
    return (
      <Col sm="12">
        <Card>
          <CardHeader><h2>{type}</h2></CardHeader>
          <CardBody>
            <div ref={this.ref}/>
          </CardBody>
        </Card>
      </Col>
    );
  }
}
