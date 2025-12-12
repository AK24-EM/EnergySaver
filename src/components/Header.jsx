import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Bell,
  Search,
  Zap,
  AlertTriangle,
  CheckCircle,
  X,
  TrendingDown,
  TrendingUp,
  Moon,
  Sun,
  WifiOff
} from 'lucide-react';
import { toggleSidebar } from '../store/slices/uiSlice';
import { acknowledgeAlert, dismissAlert } from '../store/slices/alertSlice';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { alerts, unreadCount } = useSelector((state) => state.alerts);
  const { summary } = useSelector((state) => state.usage);
  const [showNotifications, setShowNotifications] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const handleAcknowledgeAlert = (alertId) => {
    dispatch(acknowledgeAlert(alertId));
  };

  const handleDismissAlert = (alertId) => {
    dispatch(dismissAlert(alertId));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-error-600 bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-900/50 dark:text-error-400';
      case 'high':
        return 'text-warning-600 bg-warning-50 border-warning-200 dark:bg-warning-900/20 dark:border-warning-900/50 dark:text-warning-400';
      case 'medium':
        return 'text-secondary-600 bg-secondary-50 border-secondary-200 dark:bg-secondary-900/20 dark:border-secondary-900/50 dark:text-secondary-400';
      default:
        return 'text-success-600 bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-900/50 dark:text-success-400';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return AlertTriangle;
      case 'medium':
        return TrendingUp;
      default:
        return CheckCircle;
    }
  };

  return (
    <motion.header
      className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 relative z-10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search devices, insights..."
                className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 hover:bg-white transition-colors duration-200 w-64"
              />
            </div>
          </div>

          {/* Current usage indicator */}
          {summary && (
            <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
              <Zap className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">
                Today: ₹{summary.today.totalCost?.toFixed(2) || '0.00'}
              </span>
              {summary.budget && (
                <div className="flex items-center ml-2">
                  {summary.budget.todayPercentage < 80 ? (
                    <TrendingDown className="w-4 h-4 text-success-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-warning-500" />
                  )}
                  <span className="text-xs text-slate-600 ml-1">
                    {summary.budget.todayPercentage?.toFixed(0) || 0}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {!isOnline && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-medium animate-pulse border border-rose-200 dark:border-rose-800">
              <WifiOff className="w-4 h-4" />
              <span className="hidden md:inline">Offline</span>
            </div>
          )}
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-warning-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              {unreadCount > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs font-medium rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </button>

            {/* Notifications dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50"
                >
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Notifications</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="p-6 text-center text-slate-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success-400" />
                        <p>All caught up!</p>
                        <p className="text-sm">No new alerts</p>
                      </div>
                    ) : (
                      <div className="py-2">
                        {alerts.map((alert) => {
                          const SeverityIcon = getSeverityIcon(alert.severity);

                          return (
                            <motion.div
                              key={alert._id}
                              className={`px-4 py-3 border-l-4 hover:bg-slate-50 transition-colors duration-200 ${getSeverityColor(alert.severity)}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <SeverityIcon className="w-5 h-5 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-slate-900 text-sm">
                                      {alert.title}
                                    </h4>
                                    <p className="text-sm text-slate-600 mt-1">
                                      {alert.message}
                                    </p>
                                    {alert.data?.estimatedCost && (
                                      <p className="text-xs text-slate-500 mt-1">
                                        Potential monthly cost: ₹{alert.data.estimatedCost.toFixed(2)}
                                      </p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-2">
                                      {new Date(alert.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1 ml-2">
                                  {alert.status === 'active' && (
                                    <button
                                      onClick={() => handleAcknowledgeAlert(alert._id)}
                                      className="p-1 rounded-lg hover:bg-slate-200 transition-colors duration-200"
                                      title="Acknowledge"
                                    >
                                      <CheckCircle className="w-4 h-4 text-success-600" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDismissAlert(alert._id)}
                                    className="p-1 rounded-lg hover:bg-slate-200 transition-colors duration-200"
                                    title="Dismiss"
                                  >
                                    <X className="w-4 h-4 text-slate-400" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User profile */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.home?.name || 'Home'}</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </motion.header>
  );
};

export default Header;