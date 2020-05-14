import React, {useState} from 'react';
import './App.css';
import { getDevices } from './actions.js';
import { Container, Row, Col } from 'reactstrap';
import DeviceManager from './components/DeviceManager';
import GraphsWrapper from './components/GraphsWrapper';

function App() {
  const [devices, setDevices] = useState([]);
  const loadDevices = async () => {
    const devicesObject = await getDevices();
    const devices = Object.values(devicesObject).sort(
      ({ latest: {time: a} }, { latest: {time: b} }) => new Date(b) - new Date(a)
    );
    setDevices(devices);
};

  return (
    <div className="App">
      <header className="App-header">
        <Container>
          <Row>
            <Col sm="5">
              <DeviceManager devices={devices} loadDevices={loadDevices}/>
            </Col>
            <Col sm="7">
              <GraphsWrapper devices={devices}/>
            </Col>
          </Row>
        </Container>

      </header>
    </div>
  );
}

export default App;
