import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Smartphone,
  TrendingUp,
  FileText,
  Settings,
  Zap,
  Shield,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import { toggleSidebar } from '../store/slices/uiSlice';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'text-primary-600' },
    { name: 'Devices', href: '/devices', icon: Smartphone, color: 'text-secondary-600' },
    { name: 'Insights', href: '/insights', icon: TrendingUp, color: 'text-accent-600' },
    { name: 'Reports', href: '/reports', icon: FileText, color: 'text-success-600' },
    { name: 'Automation', href: '/automation', icon: Zap, color: 'text-warning-600' },
    { name: 'Settings', href: '/settings', icon: Settings, color: 'text-slate-600' },
  ];

  const adminItems = [
    { name: 'Admin', href: '/admin', icon: Shield, color: 'text-error-600' }
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const sidebarVariants = {
    open: {
      width: '16rem',
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    closed: {
      width: '4rem',
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  const linkVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        delay: 0.1
      }
    },
    closed: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      {/* Sidebar */}
      <motion.nav
        variants={sidebarVariants}
        animate={sidebarOpen ? 'open' : 'closed'}
        className={`
          fixed top-0 left-0 z-30 h-full bg-white dark:bg-slate-800 shadow-xl border-r border-slate-200 dark:border-slate-700
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <motion.div
              className="flex items-center space-x-3"
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    EnergySaver
                  </h1>
                </div>
              )}
            </motion.div>

            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-slate-500 dark:text-slate-400" /> : <Menu className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
            </button>
          </div>

          {/* User Info */}
          {sidebarOpen && user && (
            <motion.div
              className="p-4 border-b border-slate-200 dark:border-slate-700"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.home?.name || 'Home'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item, index) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-900/20 text-primary-700 dark:text-primary-400 border-r-2 border-primary-500'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : 'mx-auto'} ${item.color}`} />
                {sidebarOpen && (
                  <motion.span
                    variants={linkVariants}
                    animate={sidebarOpen ? 'open' : 'closed'}
                  >
                    {item.name}
                  </motion.span>
                )}
              </NavLink>
            ))}

            {/* Admin section */}
            {user?.role === 'admin' && (
              <>
                {sidebarOpen && (
                  <motion.div
                    className="pt-6 pb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Administration
                    </h3>
                  </motion.div>
                )}

                {adminItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => `
                      flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-error-50 to-error-100 dark:from-error-900/40 dark:to-error-900/20 text-error-700 dark:text-error-400 border-r-2 border-error-500'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                      }
                    `}
                  >
                    <item.icon className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : 'mx-auto'} ${item.color}`} />
                    {sidebarOpen && (
                      <motion.span
                        variants={linkVariants}
                        animate={sidebarOpen ? 'open' : 'closed'}
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </NavLink>
                ))}
              </>
            )}
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200 transition-all duration-200"
            >
              <LogOut className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
              {sidebarOpen && (
                <motion.span
                  variants={linkVariants}
                  animate={sidebarOpen ? 'open' : 'closed'}
                >
                  Logout
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Sidebar;