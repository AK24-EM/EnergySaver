import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { fetchDevices } from '../store/slices/deviceSlice';
import { fetchAlerts } from '../store/slices/alertSlice';
import socketService from '../services/socketService';

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);

  useEffect(() => {
    if (user?.home?._id) {
      // Initialize data
      dispatch(fetchDevices());
      dispatch(fetchAlerts());

      // Connect to socket
      socketService.connect(user.home._id);

      // Cleanup on unmount
      return () => {
        socketService.disconnect();
      };
    }
  }, [dispatch, user]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Sidebar />

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        }`}>
        <Header />

        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;