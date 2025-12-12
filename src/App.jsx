import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import AuthRoute from './components/AuthRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Insights from './pages/Insights';
import Reports from './pages/Reports';
import Automation from './pages/Automation';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/*" element={
                <AuthRoute>
                  <ErrorBoundary>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/devices" element={<Devices />} />
                        <Route path="/insights" element={<Insights />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/automation" element={<Automation />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                      </Routes>
                    </Layout>
                  </ErrorBoundary>
                </AuthRoute>
              } />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#f9fafb',
                  fontSize: '14px',
                  borderRadius: '8px'
                }
              }}
            />
          </div>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;