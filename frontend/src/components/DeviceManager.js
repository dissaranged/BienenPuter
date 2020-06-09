import React, {Component, Fragment} from 'react';
import { setDeviceOptions } from '../actions.js';
import DeviceEntry from './DeviceEntry';

import { H4, Button, ButtonGroup, Divider, Toaster } from "@blueprintjs/core";

class DeviceManager extends Component {

  state = {
    visible: true,
    deviceFilter: null,
    expanded: null,
  }

  toaster = null;

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
          <Button className="device-manager-toggle" rightIcon="maximize" title="Restore Device Manager" onClick={() => onCollapsedChange(false)} />
        </div>
      );
    }

    let filteredDevices = devices.length > 0
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
        <Button style={{float: 'left'}} className="device-manager-toggle" title="Minimize" icon="minimize" onClick={() => onCollapsedChange(true)} />
        <Button style={{float: 'right', margin: '0.5em'}} onClick={this.props.loadDevices} icon="refresh" title="Refresh device list"></Button>
        <H4>Device Manager</H4>
        <ButtonGroup fill>
          <Button onClick={() => this.setState({deviceFilter: null})} icon="filter-list" active={!deviceFilter}>All</Button>
          <Button onClick={() => this.setState({deviceFilter: 'subscribed'})} icon="filter-keep" active={deviceFilter === 'subscribed'}>
            Subscribed
          </Button>
          <Button onClick={() => this.setState({deviceFilter: 'unsubscribed'})} icon="filter-remove" active={deviceFilter === 'unsubscribed'}>Unsubscribed</Button>
        </ButtonGroup>
        <Toaster ref={ref => this.toaster = ref} />
        <div className="device-list">
          {
            filteredDevices ? filteredDevices.map( (device, i) => (
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
            )) : <em>Loading Devices ....</em>
          }
        </div>
      </div>
    );
  }

  handleToast = toast => this.toaster.show(toast);

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
