import React, {useState} from 'react';
import './App.css';
import { getDevices } from './actions.js';
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

  const [collapsed, setCollapsed] = useState(undefined);

  return (
    <div className={`app ${typeof collapsed === 'undefined' ? '' : collapsed ? 'collapsed' : 'uncollapsed'}`}>
      <DeviceManager devices={devices} loadDevices={loadDevices} collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div className="data-views"><GraphsWrapper devices={devices}/></div>
    </div>
  );
}

export default App;
