// src/App.jsx
import React, { useState } from 'react';

// Corrected imports to use relative paths from the current file's location.
// Since App.jsx is in /src, the path to /src/components is ./components
import Header from './components/Header/Header.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import ConversationalAgent from './components/ConversationalAgent/ConversationalAgent.jsx';
import MDAReviewer from './components/MDAReviewer/MDAReviewer.jsx';

// This relative import for CSS was already correct. We're applying the same logic.
import './index.css'; 

function App() {
  // State to manage which section is currently active ('conversational' or 'mda-reviewer')
  const [selectedApp, setSelectedApp] = useState('conversational'); // Default to Conversational Agent

  const handleAppSelect = (app) => {
    setSelectedApp(app);
  };

  return (
    // Assuming you have a root element with a class for styling in your CSS
    <div className="appContainer">
      <Header /> {/* Header component at the top */}
      <div className="mainContent">
        <Sidebar onSelectApp={handleAppSelect} selectedApp={selectedApp} />
        <div className="contentArea">
          {/* Conditionally render the selected component */}
          {selectedApp === 'conversational' && <ConversationalAgent />}
          {selectedApp === 'mda-reviewer' && <MDAReviewer />}
        </div>
      </div>
    </div>
  );
}

export default App;

