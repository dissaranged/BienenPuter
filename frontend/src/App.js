import React, {useState} from 'react';
import './App.css';
import { getDevices } from './actions.js';
import DeviceManager from './components/DeviceManager';
import GraphsWrapper from './components/GraphsWrapper';

import { Toaster } from "@blueprintjs/core";

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
  const [toaster, setToaster] = useState(null);

  return (
    <>
      <Toaster ref={setToaster} />
      <div className={`app ${typeof collapsed === 'undefined' ? '' : collapsed ? 'collapsed' : 'uncollapsed'}`}>
        <DeviceManager devices={devices} loadDevices={loadDevices} collapsed={collapsed} onCollapsedChange={setCollapsed} toaster={toaster} />
        <div className="data-views"><GraphsWrapper devices={devices} toaster={toaster} /></div>
      </div>
    </>
  );
}

export default App;
