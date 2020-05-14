import React, {Component} from 'react';
import {Container, Card, CardBody, CardHeader} from 'reactstrap';
import { Graph2d } from 'vis-timeline/standalone';

export default class Graph extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();

  }
  componentDidMount() {
    const { groups, dataset } = this.props;
    console.log(dataset)
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

    const graph = new Graph2d(this.ref.current, dataset, groups, opts);
  }
  render() {
    const {type} = this.props;
    return (
      <Container>
        <Card>
          <CardHeader><h2>{type}</h2></CardHeader>
          <CardBody>
            <div ref={this.ref}/>
          </CardBody>
        </Card>
      </Container>
    );
  }
}
