import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// The incorrect import for App.module.css has been removed from this file.
// We also add a global stylesheet import, which is best practice.
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);