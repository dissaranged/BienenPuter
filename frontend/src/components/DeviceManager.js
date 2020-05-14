import React, {Component} from 'react';
import { Container, Row, Col, Button } from 'reactstrap';
import { setDeviceOptions } from '../actions.js';
import DeviceEntry from './DeviceEntry';

class DeviceManager extends Component {

  state = { visible: true }
  componentDidMount() {
    this.props.loadDevices();
  }

  hide = () => this.setState({visible: false});
  show = () => this.setState({visible: true});

  render() {
    const { devices } = this.props;
    return this.state.visible ? (
      <Col sm="2">
        <Row>
          <Col sm="9">
          <h3>DeviceManager</h3>
          </Col>
          <Col sm="3">
            <Button onClick={this.hide}>Hide</Button>
          </Col>
        </Row>
        <Row>
          {devices.length > 0 ? devices.map( 
            device => (
              <DeviceEntry key={device.key.replace('@', 'AT').replace(':','COLON')} 
                           device={device}
                           onSaveOptions={this.handleChangeOptions}
              />) 
          ) : <em>Loading Devices ....</em>}
        </Row>
      </Col>
    ) : (
      <Col sm="1">
      <Button onClick={this.show}>Device Manager</Button>
      </Col>
    );
  }
  
  handleChangeOptions = async (key, options) => {
    await setDeviceOptions(key, options);
    this.props.loadDevices();
  }
}


export default DeviceManager;
