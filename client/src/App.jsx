import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Dashboard from './pages/Dashboard';
import Overlay from './pages/Overlay';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <SocketProvider role="dashboard">
              <Dashboard />
            </SocketProvider>
          }
        />
        <Route
          path="/dashboard"
          element={
            <SocketProvider role="dashboard">
              <Dashboard />
            </SocketProvider>
          }
        />
        <Route
          path="/overlay"
          element={
            <SocketProvider role="overlay">
              <Overlay />
            </SocketProvider>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
