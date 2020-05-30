import React, {Component} from 'react';
import {Row, Col, Container} from 'reactstrap';

export default class Legend extends Component {
  state = {
    hidden: {}
  }
  render() {
    const {groups, graph} = this.props;
    if(!graph || !groups)
      return <em>...</em>;
    return (
      <Row>
        {groups.map( group => {
          if(group.options.excludeFromLegend)
            return null;
          const legend = graph.getLegend(group.id, 30, 30,);
          if(!legend.icon) {
            return null;
          }
          const visible = !this.state.hidden[group.id]; // use state for this
          legend.icon.setAttributeNS(null, "class", "legend-icon");
          return (
            <Col key={group.id} onClick={this.handleToggleGroup(group.id)} xs="12" sm="6" md="4" lg="2">
              <Row >
                   <div className="vis-timeline col legend-icon" dangerouslySetInnerHTML={{__html:  legend.icon.outerHTML}} />
                   <Col>
                     { visible ? (
                       <span >{group.content}</span>
                       ) : (
                         <del>{group.content}</del>
                       )}
                   </Col>
                 </Row>
            </Col>
          );
        })}
      </Row>
    );
  }
  handleToggleGroup = (id) => () => {
    const { groups, graph } = this.props;
    const visible = !graph.isGroupVisible(id);
    const visibility = {
      [id]: visible,
      [`max-${id}`]: visible,
      [`min-${id}`]: visible,
    };
    const result = graph.setOptions({groups: {visibility}});
    this.setState({ hidden: {...this.state.hidden, [id]: !visible}});
  }
}
