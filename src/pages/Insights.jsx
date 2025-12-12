import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Leaf,
  AlertTriangle
} from 'lucide-react';
import { fetchTrends, fetchGoals } from '../store/slices/insightsSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import comparisonService from '../services/comparisonService';
import { useState } from 'react';

const Insights = () => {
  const dispatch = useDispatch();
  const { trends, goals, isLoading } = useSelector((state) => state.insights);
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    const loadComparison = async () => {
      try {
        const data = await comparisonService.getInsights();
        setComparisonData(data);
      } catch (error) {
        console.error('Failed to load comparison data', error);
      }
    };
    loadComparison();
  }, []);

  useEffect(() => {
    dispatch(fetchTrends());
    dispatch(fetchGoals());

    // Refresh every 60 seconds
    const interval = setInterval(() => {
      dispatch(fetchTrends());
      dispatch(fetchGoals());
    }, 60000);

    return () => clearInterval(interval);
  }, [dispatch]);

  if (isLoading && !trends && !goals) {
    return <LoadingSpinner />;
  }

  // Calculate comparison metrics
  const getTrendIndicator = (current, previous) => {
    if (!previous || previous === 0) return { icon: Minus, color: 'text-slate-400', text: 'No data' };
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 1) return { icon: Minus, color: 'text-slate-400', text: 'No change', value: 0 };
    if (change > 0) return { icon: ArrowUp, color: 'text-red-500', text: `${change.toFixed(1)}% higher`, value: change };
    return { icon: ArrowDown, color: 'text-green-500', text: `${Math.abs(change).toFixed(1)}% lower`, value: change };
  };

  const todayVsYesterday = trends?.comparisons ? getTrendIndicator(
    trends.comparisons.today.totalCost,
    trends.comparisons.yesterday.totalCost
  ) : null;

  const thisWeekVsLastWeek = trends?.comparisons ? getTrendIndicator(
    trends.comparisons.thisWeek.totalCost,
    trends.comparisons.lastWeek.totalCost
  ) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Insights</h1>
        <p className="text-slate-600">Actionable intelligence from your energy data</p>
      </motion.div>

      {/* Goal Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Goal */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Target className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Daily Budget</h3>
                <p className="text-sm text-slate-600">Today's spending goal</p>
              </div>
            </div>
            {goals?.daily.status === 'on-track' ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-500" />
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-slate-900">
                ₹{goals?.daily.current.toFixed(2) || '0.00'}
              </span>
              <span className="text-sm text-slate-600">
                of ₹{goals?.daily.target || '0'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${goals?.daily.status === 'on-track' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                style={{ width: `${Math.min(goals?.daily.percentage || 0, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${goals?.daily.status === 'on-track' ? 'text-green-600' : 'text-red-600'
                }`}>
                {goals?.daily.percentage.toFixed(1)}% used
              </span>
              <span className="text-slate-600">
                {goals?.daily.status === 'on-track' ? 'On track!' : 'Over budget'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Monthly Goal */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <Award className="h-6 w-6 text-secondary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Monthly Budget</h3>
                <p className="text-sm text-slate-600">This month's target</p>
              </div>
            </div>
            {goals?.monthly.status === 'on-track' ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-orange-500" />
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-slate-900">
                ₹{goals?.monthly.current.toFixed(2) || '0.00'}
              </span>
              <span className="text-sm text-slate-600">
                of ₹{goals?.monthly.target || '0'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${goals?.monthly.status === 'on-track' ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                style={{ width: `${Math.min(goals?.monthly.percentage || 0, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${goals?.monthly.status === 'on-track' ? 'text-green-600' : 'text-orange-600'
                }`}>
                {goals?.monthly.percentage.toFixed(1)}% used
              </span>
              <span className="text-slate-600">
                {goals?.monthly.status === 'on-track' ? 'On track!' : 'At risk'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Usage Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today vs Yesterday */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Today vs Yesterday</h3>
            {todayVsYesterday && React.createElement(todayVsYesterday.icon, {
              className: `h-5 w-5 ${todayVsYesterday.color}`
            })}
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-medium text-slate-600">Today</span>
                <span className="text-2xl font-bold text-slate-900">
                  ₹{trends?.comparisons.today.totalCost.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-slate-600">Yesterday</span>
                <span className="text-lg text-slate-600">
                  ₹{trends?.comparisons.yesterday.totalCost.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            {todayVsYesterday && (
              <div className={`p-3 rounded-lg ${todayVsYesterday.value > 0 ? 'bg-red-50' : todayVsYesterday.value < 0 ? 'bg-green-50' : 'bg-slate-50'
                }`}>
                <p className={`text-sm font-medium ${todayVsYesterday.color}`}>
                  {todayVsYesterday.text}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {todayVsYesterday.value > 5
                    ? '💡 Consider reducing usage during peak hours'
                    : todayVsYesterday.value < -5
                      ? '🎉 Great job! Keep up the savings'
                      : 'Usage is stable'}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* This Week vs Last Week */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">This Week vs Last Week</h3>
            {thisWeekVsLastWeek && React.createElement(thisWeekVsLastWeek.icon, {
              className: `h-5 w-5 ${thisWeekVsLastWeek.color}`
            })}
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-medium text-slate-600">This Week</span>
                <span className="text-2xl font-bold text-slate-900">
                  ₹{trends?.comparisons.thisWeek.totalCost.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-slate-600">Last Week</span>
                <span className="text-lg text-slate-600">
                  ₹{trends?.comparisons.lastWeek.totalCost.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            {thisWeekVsLastWeek && (
              <div className={`p-3 rounded-lg ${thisWeekVsLastWeek.value > 0 ? 'bg-red-50' : thisWeekVsLastWeek.value < 0 ? 'bg-green-50' : 'bg-slate-50'
                }`}>
                <p className={`text-sm font-medium ${thisWeekVsLastWeek.color}`}>
                  {thisWeekVsLastWeek.text}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {thisWeekVsLastWeek.value > 10
                    ? '⚠️ Significant increase - check for unusual activity'
                    : thisWeekVsLastWeek.value < -10
                      ? '🌟 Excellent progress on your savings goals'
                      : 'Weekly usage is consistent'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Neighborhood Comparison Section */}
      {comparisonData && (
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Neighborhood Comparison</h3>
              <p className="text-sm text-slate-600">
                Matched with <span className="font-semibold text-indigo-600">{comparisonData.cluster?.size > 20 ? comparisonData.cluster.size : 'similar'} homes</span> based on
                {comparisonData.cluster?.criteria?.rooms} rooms, {comparisonData.cluster?.criteria?.climateZone} climate, and device profile.
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold ${comparisonData.efficiencyRank >= 75 ? 'bg-green-100 text-green-700' :
              comparisonData.efficiencyRank >= 50 ? 'bg-yellow-100 text-yellow-700' :
                'bg-orange-100 text-orange-700'
              }`}>
              Top {100 - comparisonData.efficiencyRank}% Efficient
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Efficiency Gauge */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl">
              <div className="relative w-48 h-24 overflow-hidden mb-4">
                <div className="absolute top-0 left-0 w-full h-full bg-slate-200 rounded-t-full"></div>
                <div
                  className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded-t-full origin-bottom transition-transform duration-1000"
                  style={{ transform: `rotate(${(comparisonData.efficiencyRank / 100) * 180 - 180}deg)` }}
                ></div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{comparisonData.efficiencyRank}/100</p>
              <p className="text-sm text-slate-500">Efficiency Score</p>
            </div>

            {/* Metrics Comparison */}
            <div className="lg:col-span-2 space-y-4">
              {/* Carbon Footprint Position */}
              {trends?.benchmarking && (
                <div className="flex items-start gap-4 p-4 rounded-xl border bg-green-50 border-green-100">
                  <div className="p-2 rounded-full bg-green-100 text-green-600">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">Carbon Footprint</h4>
                    <p className="text-sm text-slate-700 mt-1">
                      Your weekly carbon footprint is <strong>{trends.benchmarking.carbonFootprint.user.toFixed(1)} kg CO2</strong>, which is
                      <span className="font-bold"> {trends.benchmarking.carbonFootprint.status} </span>
                      than the neighborhood average ({trends.benchmarking.carbonFootprint.neighborhood.toFixed(1)} kg).
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 border border-slate-100 rounded-lg">
                  <p className="text-xs text-slate-500">Your Usage / Person</p>
                  <p className="text-lg font-bold text-slate-800">{comparisonData.userMetrics?.kwhPerCapita?.toFixed(1) || '-'} kWh</p>
                </div>
                <div className="p-3 border border-slate-100 rounded-lg">
                  <p className="text-xs text-slate-500">Cluster Average</p>
                  <p className="text-lg font-bold text-slate-600">{comparisonData.benchmarkMetrics?.avgKwhPerCapita?.toFixed(1) || '-'} kWh</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Wasteful Devices Alert */}
      {trends?.wastefulDevices && trends.wastefulDevices.length > 0 && (
        <motion.div
          className="bg-orange-50 rounded-xl shadow border border-orange-200 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="font-bold text-orange-800">Potential Waste Detected</h3>
          </div>
          <p className="text-sm text-orange-700 mb-3">The following devices have unusually high usage patterns:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {trends.wastefulDevices.map(device => (
              <div key={device.deviceId} className="bg-white p-3 rounded-lg border border-orange-100 flex justify-between items-center">
                <span className="font-medium text-slate-800">{device.name}</span>
                <span className="text-xs font-bold text-orange-600">{device.percentage}% of total</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top Consumers */}
      <motion.div
        className="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Top Energy Consumers</h3>
            <p className="text-sm text-slate-600">Last 7 days</p>
          </div>
          <Zap className="h-6 w-6 text-warning-500" />
        </div>

        {trends?.topConsumers && trends.topConsumers.length > 0 ? (
          <div className="space-y-4">
            {trends.topConsumers.map((device, index) => (
              <div key={device.deviceId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-slate-100 text-slate-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-50 text-slate-600'
                      }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{device.name}</p>
                      <p className="text-xs text-slate-500">{device.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">₹{device.totalCost.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{device.percentage}% of total</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-slate-400' :
                        index === 2 ? 'bg-orange-500' :
                          'bg-slate-300'
                      }`}
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No usage data available yet</p>
            <p className="text-sm">Data will appear as devices are used</p>
          </div>
        )}
      </motion.div>

      {/* Actionable Recommendations */}
      <motion.div
        className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl shadow-lg border border-primary-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <TrendingUp className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">What should you do?</h3>
            <div className="space-y-2">
              {todayVsYesterday?.value > 5 && (
                <p className="text-sm text-slate-700">
                  • Your usage is higher than yesterday. Check if any devices are running unnecessarily.
                </p>
              )}
              {goals?.daily.status === 'exceeded' && (
                <p className="text-sm text-slate-700">
                  • You've exceeded your daily budget. Consider turning off idle devices.
                </p>
              )}
              {trends?.topConsumers && trends.topConsumers[0] && (
                <p className="text-sm text-slate-700">
                  • Your <strong>{trends.topConsumers[0].name}</strong> is the top consumer.
                  Review its usage patterns for optimization opportunities.
                </p>
              )}
              {(!todayVsYesterday || todayVsYesterday.value <= 5) && goals?.daily.status === 'on-track' && (
                <p className="text-sm text-slate-700">
                  ✅ You're doing great! Keep maintaining your current usage patterns.
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div >
  );
};

export default Insights;
