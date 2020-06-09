import React, {Component, Fragment} from 'react';
import moment from 'moment';

import { Pre, Intent, Card, FormGroup, Button, Switch, Icon, Tooltip, Collapse, Tabs, Tab } from "@blueprintjs/core";

class DeviceEntry extends Component {
  state = {
    alias: this.props.device.alias || '',
    color: this.props.device.color || '#ffffff',
    hasChanged: false,
    tab: 'details',
  };
  constructor(props) {
    super(props);
    this.tooltipTarget = React.createRef();
  }

  handleTabChange = (tab) => {
    this.setState({ tab });
  }

  render() {
    const { expanded } = this.props;
    const {key, subscribed, latest, alias, color} = this.props.device;
    const {hasChanged, alias: newAlias, color: newColor, tab} = this.state;
    const age = moment(new Date(latest.time)).fromNow();
    return (
      <div className="device">
        <div className="header">
          <div className="color-indicator" style={{background: color}} />
          <strong className="name" style={{verticalAlign: 'middle'}}>{alias || key}</strong>
          <div className="controls">
            {!expanded && (
              <Tooltip content="Show details">
                <Button minimal icon="more" onClick={() => this.props.onExpand(key)} />
              </Tooltip>
            )}
            <Tooltip
              content={subscribed ? "Subscribed" : "Toggle to subscribe"}
              intent={subscribed ? Intent.SUCCESS : Intent.PRIMARY}
            >
              <Switch
                checked={subscribed || false}
                onChange={this.handleSubscribedChange}
              />
            </Tooltip>
          </div>
        </div>
        <Collapse isOpen={expanded}>
          <Button style={{float: 'right'}} icon="cross" minimal title="Close details" onClick={() => this.props.onExpand(null)} />
          <Card className="details">
            <Tabs selectedTabId={tab} onChange={this.handleTabChange}>
              <Tab id="details" title="Details" panel={(
                <table>
                  <tbody>
                    <tr>
                      <th>Model</th>
                      <td>{latest.model}</td>
                    </tr>
                    <tr>
                      <th>Last Seen</th>
                      <td>{age}</td>
                    </tr>
                  </tbody>
                </table>
              )} />
              <Tab id="data" title={<><Icon icon="bring-data"/> Data</>} panel={
                <Pre>{JSON.stringify(this.props.device, null, 2)}</Pre>
              } />
              <Tab id="settings" title={<><Icon icon="settings"/> Settings</>} panel={(
                <Fragment>
                  <FormGroup label="Alias" inline>
                    <input type="text" onChange={this.handleAliasChange} value={newAlias} placeholder="Alias" />
                  </FormGroup>
                  <FormGroup label="Color" inline>
                    <input type="color" onChange={this.handleColorChange} value={newColor} placeholder="pick a color"/>
                  </FormGroup>
                  {hasChanged && <Button onClick={this.handleOptionsSave}>Apply</Button>}
                </Fragment>
              )} />
            </Tabs>
          </Card>
        </Collapse>
      </div>
    );
  }

  handleAliasChange = ({target: {value}}) => this.setState({alias: value, hasChanged: true})
  handleColorChange = ({target: {value}}) => this.setState({color: value, hasChanged: true})
  handleOptionsSave = async () => {
    const color = this.state.color || this.props.device.color;
    const alias = this.state.alias || this.props.device.alias;
    try {
      await this.props.onSaveOptions(this.props.device.key, {color, alias});
      this.setState({hasChanged: false});
    } catch (e) {
      this.props.onToast({
        icon: 'warning-sign',
        message: 'Failed to update settings',
        intent: Intent.DANGER,
      });
      throw e;
    }
    this.props.onToast({
      icon: 'tick',
      message: 'Settings saved',
      intent: Intent.SUCCESS,
    });
  }
  handleSubscribedChange = async (event) => {
    const checked = event.target.checked;
    try {
      await this.props.onSaveOptions(this.props.device.key, {subscribed: checked});
    } catch (e) {
      this.props.onToast({
        icon: 'warning-sign',
        message: 'Failed to update subscription status',
        intent: Intent.DANGER,
      });
      throw e;
    }
    this.props.onToast({
      icon: 'tick',
      message: checked ? `Subscribed to ${this.props.device.key}` : `Unsubscribed from ${this.props.device.key}`,
      intent: Intent.SUCCESS,
      timeout: 1000,
    });
  }
}


export default DeviceEntry;
