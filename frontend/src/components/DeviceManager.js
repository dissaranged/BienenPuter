import React, {Component, Fragment} from 'react';
import { setDeviceOptions } from '../actions.js';
import DeviceEntry from './DeviceEntry';

import { H4, Button, ButtonGroup, Divider, NonIdealState } from "@blueprintjs/core";

class DeviceManager extends Component {

  state = {
    visible: true,
    deviceFilter: null,
    expanded: null,
  }

  componentDidMount() {
    this.props.loadDevices();
  }

  hide = () => this.setState({visible: false});
  show = () => this.setState({visible: true});

  render() {
    const { devices, collapsed, onCollapsedChange } = this.props;
    const { deviceFilter, expanded } = this.state;
    if (collapsed) {
      return (
        <div className="device-manager">
          <Button
            className="device-manager-toggle"
            icon="menu-open"
            title="Restore Device Manager"
            onClick={() => onCollapsedChange(false)}
          />
        </div>
      );
    }

    let filteredDevices = devices
        ? devices.filter( device => {
          switch(deviceFilter) {
          case 'subscribed':
            return !!device.subscribed;
          case 'unsubscribed':
            return !device.subscribed;
          default:
            return true;
          }
        })
        : null;

    return (
      <div className="device-manager">
        <Button
          className="device-manager-toggle"
          icon="menu-closed"
          title="Minimize"
          onClick={() => onCollapsedChange(true)}
        />
        <Button
          className="device-manager-refresh"
          icon="refresh"
          title="Refresh device list"
          onClick={this.props.loadDevices}
        />
        <H4>Device Manager</H4>
        <ButtonGroup fill>
          <Button onClick={() => this.setState({deviceFilter: null})} icon="filter-list" active={!deviceFilter}>All</Button>
          <Button onClick={() => this.setState({deviceFilter: 'subscribed'})} icon="filter-keep" active={deviceFilter === 'subscribed'}>
            Subscribed
          </Button>
          <Button onClick={() => this.setState({deviceFilter: 'unsubscribed'})} icon="filter-remove" active={deviceFilter === 'unsubscribed'}>Unsubscribed</Button>
        </ButtonGroup>
        <div className="device-list">
          {
            filteredDevices && filteredDevices.length > 0
              ? filteredDevices.map( (device, i) => (
                <Fragment key={device.key.replace('@', 'AT').replace(':','COLON')}>
                  {i > 0 && <Divider />}
                  <DeviceEntry
                    device={device}
                    expanded={expanded === device.key}
                    onToast={this.handleToast}
                    onExpand={this.handleExpand}
                    onSaveOptions={this.handleChangeOptions}
                  />
                </Fragment>
              ))
              : filteredDevices
              ? <NonIdealState title="No Device found" icon="cell-tower" />
              : <em>Loading Devices ....</em>
          }
        </div>
      </div>
    );
  }

  handleToast = toast => this.props.toaster.show(toast);

  handleExpand = key => {
    this.setState({ expanded: key });
  }

  handleFilterChange = () => {
    const {deviceFilter} = this.state;
    const states = ['subscribed', 'unsubscribed'];
    this.setState({
      deviceFilter: states[ states.indexOf(deviceFilter) +1 ]
    });
    console.log(states, deviceFilter, states[ states.indexOf(deviceFilter) +1 ])
  };

  handleChangeOptions = async (key, options) => {
    await setDeviceOptions(key, options);
    this.props.loadDevices();
  }
}


export default DeviceManager;
