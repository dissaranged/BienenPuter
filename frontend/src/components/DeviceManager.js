import React, {Component} from 'react';
import { Container, Row } from 'reactstrap';
import { setDeviceOptions } from '../actions.js';
import DeviceEntry from './DeviceEntry';

class DeviceManager extends Component {

  componentDidMount() {
    this.props.loadDevices();
  }

  render() {
    const { devices } = this.props;
    return (
      <Container>
        <h1>DeviceManager</h1>
        <Row>
          {devices.length > 0 ? devices.map( 
            device => (
              <DeviceEntry key={device.key.replace('@', 'AT').replace(':','COLON')} 
                           device={device}
                           onSaveOptions={this.handleChangeOptions}
              />) 
          ) : <em>Loading Devices ....</em>}
        </Row>
      </Container>
    );
  }
  
  handleChangeOptions = async (key, options) => {
    await setDeviceOptions(key, options);
    this.props.loadDevices();
  }
}


export default DeviceManager;
