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
    <header>
      <Container>
        <h2>Sensor Suite</h2>
      </Container></header>
      <Row>
        <DeviceManager devices={devices} loadDevices={loadDevices}/>
        <GraphsWrapper devices={devices}/>
      </Row>
    </div>
  );
}

export default App;
