import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import ComplianceGate from './components/ComplianceGate';
import Dashboard from './components/Dashboard';
// import CoursePlayer from './components/CoursePlayer';
// import PracticeScheduler from './components/PracticeScheduler';
import CertificateValidator from './components/CertificateValidator';

import React from 'react';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/validate" element={<CertificateValidator />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/compliance" element={<ComplianceGate />} />
        {/* <Route path="/practices" element={<PracticeScheduler />} /> */}
        {/* <Route path="/classroom/:courseId" element={<CoursePlayer />} /> */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
