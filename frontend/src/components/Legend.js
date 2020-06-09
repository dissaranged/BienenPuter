import React, {Component} from 'react';

import { OverflowList } from '@blueprintjs/core';

export default class Legend extends Component {
  state = {
    hidden: {}
  }
  render() {
    const {groups, graph} = this.props;
    if(!graph || !groups)
      return <em>...</em>;

    let items = groups
        .map(group => group)
        .filter(group => !group.options.excludeFromLegend);

    return (
      <div className="legend">
        <OverflowList items={items} visibleItemRenderer={this.renderVisibleItem} overflowRenderer={this.renderOverflow} />
      </div>
    );
  }

  renderVisibleItem = group => {
    let icon = this.icon(group);
    if (!icon) {
      return null;
    }
    let visible = !this.state.hidden[group.id];
    return (
      <div onClick={this.handleToggleGroup(group.id)}>
        {icon} {visible ? <span>{group.content}</span> : <del>{group.content}</del>}
      </div>
    );
  }

  icon(group) {
    let legend = this.props.graph.getLegend(group.id, 20, 20,);
    if (!legend.icon) {
      return null;
    }
    return <svg width="20" height="20" className="vis-timeline" dangerouslySetInnerHTML={{__html: legend.icon.innerHTML}} />;
  }

  renderOverflow = groups => {
    // TODO: render a menu or something, with the groups that didn't fit.
  }

  handleToggleGroup = (id) => () => {
    const { graph } = this.props;
    const visible = !graph.isGroupVisible(id);
    const visibility = {
      [id]: visible,
      [`max-${id}`]: visible,
      [`min-${id}`]: visible,
    };
    graph.setOptions({groups: {visibility}});
    this.setState({ hidden: {...this.state.hidden, [id]: !visible}});
  }
}
