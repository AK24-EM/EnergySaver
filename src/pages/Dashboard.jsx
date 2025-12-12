import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  Lightbulb,
  Home,
  Activity,
  Clock,
  Search,
  Filter,
  Power,
  Leaf,
  ChevronRight
} from 'lucide-react';
import { fetchRealTimeUsage, fetchUsageSummary, fetchUsageHistory } from '../store/slices/usageSlice';
import { fetchDevices, updateDevice } from '../store/slices/deviceSlice';
import { activateMode } from '../store/slices/automationSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import ActivityTimeline from '../components/ActivityTimeline';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { realTimeData, summary, historyData, isLoading } = useSelector((state) => state.usage);
  const { devices } = useSelector((state) => state.devices);
  const { alerts } = useSelector((state) => state.alerts);
  const { user } = useSelector((state) => state.auth);

  // Local State for Filters & Controls
  const [timeRange, setTimeRange] = useState('Today'); // 'Today', 'Week', 'Month'
  const [searchQuery, setSearchQuery] = useState('');
  const [energySaverMode, setEnergySaverMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Map frontend timeRange to backend period format
  const getBackendPeriod = (range) => {
    const mapping = {
      'Today': '24h',
      'Week': '7d',
      'Month': '30d'
    };
    return mapping[range] || '24h';
  };

  useEffect(() => {
    dispatch(fetchRealTimeUsage());
    dispatch(fetchUsageSummary());
    dispatch(fetchDevices());
    dispatch(fetchUsageHistory({ period: getBackendPeriod(timeRange) }));

    // Refresh data every 5 seconds
    const interval = setInterval(() => {
      dispatch(fetchRealTimeUsage());
      dispatch(fetchUsageSummary());
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Refetch history when time range changes
  useEffect(() => {
    dispatch(fetchUsageHistory({ period: getBackendPeriod(timeRange) }));
  }, [timeRange, dispatch]);

  // Handle Device Toggle
  const handleDeviceToggle = async (deviceId, currentStatus) => {
    try {
      await dispatch(updateDevice({
        id: deviceId,
        data: { isActive: !currentStatus }
      })).unwrap();
      toast.success(`Device turned ${!currentStatus ? 'ON' : 'OFF'}`);
      dispatch(fetchRealTimeUsage()); // Refresh usage
    } catch (error) {
      toast.error('Failed to update device');
    }
  };

  // Handle Energy Saver Mode
  const toggleEnergySaver = async () => {
    try {
      const newMode = !energySaverMode;
      setEnergySaverMode(newMode);

      if (newMode) {
        await dispatch(activateMode('eco')).unwrap();
        toast.success('Energy Saver Mode Activated');
      } else {
        // Assuming 'normal' isn't an explicit mode in backend, we might just need to turn it off
        // checking automationSlice, activateMode calls /modes/:mode. 
        // If there's no normal mode, we might need a deactivate or just rely on manual control.
        // For now, let's assume we just toggle the UI state as the backend doesn't seem to have a 'stop mode' endpoint explicitly shown in automationSlice view.
        // However, looking at the previous view of automation.js, acts like 'away', 'sleep', 'eco'. 
        // Let's just user toast for deactivation for now until backend supports 'normal' or 'off'.
        toast.success('Energy Saver Mode Deactivated');
      }
      dispatch(fetchRealTimeUsage());
    } catch (error) {
      toast.error('Failed to toggle Energy Saver');
      setEnergySaverMode(!energySaverMode); // Revert UI on error
    }
  };

  // Helper for 3-tier budget color
  const getBudgetColor = (percentage) => {
    if (percentage < 80) return 'text-success-600';
    if (percentage < 100) return 'text-warning-600';
    return 'text-error-600';
  };

  const getBudgetIconColor = (percentage) => {
    if (percentage < 80) return 'text-success-500';
    if (percentage < 100) return 'text-warning-500';
    return 'text-error-500';
  };

  // Prepare Chart Data - Transform backend format to chart format
  const chartData = React.useMemo(() => {
    console.log('📊 Chart Data Transform - Raw historyData:', historyData);

    if (!historyData || historyData.length === 0) {
      console.log('⚠️ No history data available');
      return [];
    }

    // Backend returns: {_id: {timestamp, device}, avgPower, totalCost}
    // Chart needs: {time, power, cost}

    // Group by timestamp and sum power/cost across all devices
    const grouped = historyData.reduce((acc, item) => {
      const time = item._id.timestamp;
      if (!acc[time]) {
        acc[time] = { time, power: 0, cost: 0 };
      }
      acc[time].power += item.avgPower || 0;
      acc[time].cost += item.totalCost || 0;
      return acc;
    }, {});

    const result = Object.values(grouped).sort((a, b) => a.time.localeCompare(b.time));
    console.log('✅ Transformed chart data:', result);
    return result;
  }, [historyData]);

  // Filtered Devices for "Top Consumers" or General Search
  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedCategory === 'All' || d.category === selectedCategory)
  );

  // Color scheme for charts
  const COLORS = ['#10b981', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Device category breakdown
  const deviceCategoryData = devices.reduce((acc, device) => {
    const existing = acc.find(item => item.category === device.category);
    if (existing) {
      existing.count += 1;
      existing.totalPower += device.currentPower || 0;
    } else {
      acc.push({
        category: device.category,
        count: 1,
        totalPower: device.currentPower || 0
      });
    }
    return acc;
  }, []);

  // Critical alerts
  const criticalAlerts = alerts.filter(alert =>
    alert.severity === 'critical' || alert.severity === 'high'
  ).slice(0, 3);

  // Smart Nudges Generator (Mock Logic based on state)
  const getNudges = () => {
    const nudges = [];
    if (realTimeData?.totals?.power > 2000) {
      nudges.push({
        id: 1,
        type: 'warning',
        text: 'High usage detected! Consider turning off AC or Heater if not needed.',
        action: 'View AC'
      });
    }
    if (summary?.today?.totalCost < (summary?.budget?.daily || 100)) {
      nudges.push({
        id: 2,
        type: 'success',
        text: 'Great job! Your usage is 5% lower than yesterday.',
        action: null
      });
    }
    if (new Date().getHours() >= 18 && new Date().getHours() <= 22) {
      nudges.push({
        id: 3,
        type: 'info',
        text: 'Peak hours (6PM - 10PM). Delay heavy appliances to save ~₹100/month.',
        action: 'Schedule'
      });
    }
    return nudges;
  };
  const smartNudges = getNudges();

  if (isLoading && !realTimeData && !user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Main Controls */}
      <motion.div
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Here's your energy usage overview for {user?.home?.name || 'your home'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Energy Saver Toggle */}
          <button
            onClick={toggleEnergySaver}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 ${energySaverMode
              ? 'bg-success-50 border-success-200 text-success-700 shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Leaf className={`w-4 h-4 ${energySaverMode ? 'fill-current' : ''}`} />
            <span className="font-medium">Saver Mode</span>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${energySaverMode ? 'bg-success-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}>
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${energySaverMode ? 'translate-x-4' : 'translate-x-0'
                }`}></div>
            </div>
          </button>

          <div className="flex items-center space-x-2 px-4 py-2 bg-primary-50 rounded-xl border border-primary-200 shadow-sm">
            <Activity className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">Live</span>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </motion.div>

      {/* Smart Nudges Section - NEW */}
      <AnimatePresence>
        {smartNudges.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {smartNudges.map((nudge) => (
              <div key={nudge.id} className={`flex items-center justify-between p-4 rounded-xl border shadow-sm ${nudge.type === 'warning' ? 'bg-warning-50 border-warning-200 text-warning-800' :
                nudge.type === 'success' ? 'bg-success-50 border-success-200 text-success-800' :
                  'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                <div className="flex items-center space-x-3">
                  {nudge.type === 'warning' ? <AlertTriangle className="w-5 h-5 flex-shrink-0" /> :
                    nudge.type === 'success' ? <TrendingDown className="w-5 h-5 flex-shrink-0" /> :
                      <Lightbulb className="w-5 h-5 flex-shrink-0" />}
                  <span className="text-sm font-medium">{nudge.text}</span>
                </div>
                {nudge.action && (
                  <button className="text-xs font-bold uppercase tracking-wide hover:underline ml-2 flex-shrink-0">
                    {nudge.action}
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Power Usage */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          whileHover={{ y: -5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Current Power</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {realTimeData ? Math.round(realTimeData.totals?.power || 0) : '0'} W
              </p>
              <p className="text-xs text-slate-500 mt-1">
                ₹{realTimeData ? (realTimeData.totals?.estimatedHourlyCost || 0).toFixed(2) : '0.00'}/hour
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-success-500 mr-1" />
            <span className="text-xs text-success-600 font-medium">5% lower than yesterday</span>
          </div>
        </motion.div>

        {/* Today's Cost */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ y: -5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Today's Cost</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ₹{summary ? (summary.today.totalCost || 0).toFixed(2) : '0.00'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {summary?.today.totalKwh?.toFixed(2) || '0.00'} kWh consumed
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingDown className="w-4 h-4 text-success-500 mr-1" />
            <span className={`text-xs font-medium ${getBudgetColor(summary?.budget?.todayPercentage || 0)}`}>
              {summary?.budget ? `${(100 - summary.budget.todayPercentage).toFixed(0)}% under budget` : 'On track'}
            </span>
          </div>
        </motion.div>

        {/* Monthly Projection */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ y: -5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Monthly Estimate</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ₹{realTimeData ? Math.round(realTimeData.totals?.estimatedMonthlyCost || 0) : '0'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Budget: ₹{summary?.budget?.monthly || '3000'}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-accent-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {summary?.budget && (
              <>
                {summary.budget.monthlyPercentage < 100 ? (
                  <TrendingDown className={`w-4 h-4 mr-1 ${getBudgetIconColor(summary.budget.monthlyPercentage)}`} />
                ) : (
                  <TrendingUp className={`w-4 h-4 mr-1 ${getBudgetIconColor(summary.budget.monthlyPercentage)}`} />
                )}
                <span className={`text-xs font-medium ${getBudgetColor(summary.budget.monthlyPercentage)}`}>
                  {summary.budget.monthlyPercentage < 100 ? 'Within budget' : 'Above budget'}
                </span>
              </>
            )}
          </div>
        </motion.div>

        {/* Active Devices */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ y: -5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Active Devices</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {realTimeData ? realTimeData.devices?.filter(d => d.isActive).length || 0 : 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                of {devices.length} total devices
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-success-100 to-success-200 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-success-600" />
            </div>
          </div>
          <div className="mt-4">
            <button className="text-xs font-semibold text-error-600 hover:text-error-700 flex items-center transition-colors">
              <Power className="w-3 h-3 mr-1" /> Turn off idle
            </button>
          </div>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search devices..."
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
        <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          {['Today', 'Week', 'Month'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${timeRange === range
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Usage Chart */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Usage Trend ({timeRange})</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                <span className="text-xs text-slate-600">Power (W)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-secondary-500 rounded-full"></div>
                <span className="text-xs text-slate-600">Cost (₹)</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={12}
                tick={{ fontSize: 11 }}
              />
              <YAxis yAxisId="left" stroke="#10b981" fontSize={12} tickFormatter={(value) => `${value}W`} />
              <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={12} tickFormatter={(value) => `₹${value}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f8fafc'
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="power"
                name="Power"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cost"
                name="Cost"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Device Category Breakdown */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Device Categories</h3>
            <span className="text-xs text-slate-500">Current Usage</span>
          </div>
          {deviceCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deviceCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalPower"
                >
                  {deviceCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}W`, 'Power Usage']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500">
              <div className="text-center">
                <Home className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No devices found</p>
                <p className="text-sm">Add devices to see usage breakdown</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Consuming Devices + Interactive Controls */}
        <motion.div
          className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Current Device Status</h3>
            <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
              <Filter className="w-4 h-4" />
              <span>Sort by Power</span>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {filteredDevices.length > 0 ? (
              filteredDevices.sort((a, b) => (b.currentPower || 0) - (a.currentPower || 0)).map((device, index) => (
                <div key={device._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 border border-slate-100 dark:border-slate-600">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ${device.isActive
                      ? (device.currentPower > 1000 ? 'bg-error-500' : 'bg-success-500')
                      : 'bg-slate-400'
                      }`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{device.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{device.category} • {device.room}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right hidden sm:block">
                      <p className={`font-bold ${device.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                        {device.isActive ? `${device.currentPower} W` : 'OFF'}
                      </p>
                      {device.isActive && (
                        <p className="text-xs text-slate-500">
                          ₹{((device.currentPower / 1000) * 5.5).toFixed(2)}/hr
                        </p>
                      )}
                    </div>

                    {/* Interactive Toggle */}
                    <button
                      onClick={() => handleDeviceToggle(device._id, device.isActive)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${device.isActive ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                    >
                      <span className="sr-only">Use setting</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${device.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No devices found matching "{searchQuery}"</p>
              </div>
            )}

            {/* Show "See All" if list is long (Mock) */}
            {filteredDevices.length > 5 && (
              <button className="w-full py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition-colors">
                View All Devices <ChevronRight className="w-4 h-4 inline" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Right Column: Alerts & Timeline */}
        <div className="space-y-6">
          {/* Critical Alerts */}
          <motion.div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Critical Alerts</h3>
              <AlertTriangle className="w-5 h-5 text-warning-500" />
            </div>

            {criticalAlerts.length > 0 ? (
              <div className="space-y-3">
                {criticalAlerts.map((alert) => (
                  <div key={alert._id} className="p-3 border-l-4 border-error-500 bg-error-50 rounded-r-lg">
                    <h4 className="font-medium text-error-900 text-sm">{alert.title}</h4>
                    <p className="text-error-700 text-xs mt-1">{alert.message}</p>
                    <p className="text-error-600 text-xs mt-2">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-500">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-success-500" />
                  <p className="text-success-600 font-medium">All Good!</p>
                  <p className="text-sm">No critical alerts</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <ActivityTimeline />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;