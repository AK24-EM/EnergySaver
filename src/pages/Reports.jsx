import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Calendar, TrendingUp, TrendingDown, DollarSign,
  Zap, Target, Clock, Cpu, Bot, Leaf, AlertTriangle, ChevronRight,
  BarChart3, PieChart, Activity, Lightbulb, ArrowUpRight, ArrowDownRight, X, Loader2
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import reportService from '../services/reportService';
import exportService from '../services/exportService';

// Color palette
const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];
const EFFICIENCY_COLORS = { efficient: '#22c55e', moderate: '#f59e0b', inefficient: '#ef4444' };

// Report type configuration
const REPORT_TYPES = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'cost', label: 'Cost Breakdown', icon: DollarSign },
  { id: 'peak', label: 'Peak Hours', icon: Clock },
  { id: 'goals', label: 'Goal Progress', icon: Target },
  { id: 'efficiency', label: 'Device Efficiency', icon: Cpu },
  { id: 'automation', label: 'Automation Impact', icon: Bot },
  { id: 'forecast', label: 'Forecast', icon: TrendingUp },
  { id: 'carbon', label: 'Carbon Impact', icon: Leaf }
];

const PERIOD_OPTIONS = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This Week' },
  { id: 'monthly', label: 'This Month' }
];

// Summary Card Component
const SummaryCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    success: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    warning: 'bg-gradient-to-br from-amber-500 to-orange-600',
    danger: 'bg-gradient-to-br from-rose-500 to-pink-600'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`${colorClasses[color]} rounded-2xl p-5 text-white shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className="p-2 bg-white/20 rounded-xl">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-sm">
          {trend === 'up' ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          <span className="font-medium">{trendValue}</span>
          <span className="text-white/70">vs last period</span>
        </div>
      )}
    </motion.div>
  );
};

// Cost Breakdown Component
const CostBreakdownSection = ({ data, loading }) => {
  if (loading || !data) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* By Device Pie Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Cost by Device</h3>
        <ResponsiveContainer width="100%" height={250}>
          <RechartsPie>
            <Pie
              data={data.byDevice?.slice(0, 6) || []}
              dataKey="cost"
              nameKey="deviceName"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.byDevice?.slice(0, 6).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
          </RechartsPie>
        </ResponsiveContainer>
      </div>

      {/* By Category Bar Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Cost by Category</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.byCategory || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tickFormatter={(v) => `₹${v}`} />
            <YAxis type="category" dataKey="category" width={100} />
            <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
            <Bar dataKey="cost" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Time of Day Distribution */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Cost by Time of Day</h3>
        <div className="grid grid-cols-4 gap-4">
          {data.byTimeOfDay?.map((item, index) => (
            <div
              key={item.period}
              className="text-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600"
            >
              <div className="text-2xl mb-2">
                {item.period === 'morning' && '🌅'}
                {item.period === 'afternoon' && '☀️'}
                {item.period === 'evening' && '🌆'}
                {item.period === 'night' && '🌙'}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 capitalize">{item.period}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">₹{item.cost.toFixed(0)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.percentage}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Peak Hours Heatmap Component
const PeakHoursSection = ({ data, loading }) => {
  if (loading || !data) {
    return <LoadingSkeleton />;
  }

  const maxPower = Math.max(...(data.hourlyData?.map(h => h.power) || [1]));

  const getHeatColor = (power) => {
    const intensity = power / maxPower;
    if (intensity < 0.25) return 'bg-emerald-200';
    if (intensity < 0.5) return 'bg-yellow-300';
    if (intensity < 0.75) return 'bg-orange-400';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6">
      {/* Hourly Heatmap */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">24-Hour Usage Heatmap</h3>
        <div className="grid grid-cols-12 gap-2">
          {data.hourlyData?.map((hour, index) => (
            <motion.div
              key={hour.hour}
              whileHover={{ scale: 1.1 }}
              className={`${getHeatColor(hour.power)} ${hour.isPeakTariff ? 'ring-2 ring-rose-600' : ''} 
                rounded-lg p-2 text-center cursor-pointer transition-all`}
              title={`${hour.hour}:00 - ₹${hour.cost.toFixed(2)}`}
            >
              <p className="text-xs font-medium text-slate-700">{hour.hour}</p>
              <p className="text-xs text-slate-600">₹{hour.cost.toFixed(0)}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-emerald-200"></span> Low
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-yellow-300"></span> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-orange-400"></span> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-rose-500"></span> Very High
            </span>
          </div>
          <span className="flex items-center gap-1 text-rose-600">
            <span className="w-4 h-4 rounded border-2 border-rose-600"></span> Peak Tariff Hour
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
              <Clock className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Peak Cost</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">₹{data.summary?.peakCost?.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <TrendingDown className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Off-Peak Cost</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">₹{data.summary?.offPeakCost?.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Peak Usage</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{data.summary?.peakPercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-6 w-6 flex-shrink-0" />
          <p className="text-sm">{data.summary?.recommendation}</p>
        </div>
      </div>
    </div>
  );
};

// Goal Progress Section
const GoalProgressSection = ({ data, loading }) => {
  if (loading || !data) {
    return <LoadingSkeleton />;
  }

  const statusColors = {
    on_track: 'text-emerald-600 bg-emerald-100',
    at_risk: 'text-amber-600 bg-amber-100',
    exceeded: 'text-rose-600 bg-rose-100',
    completed: 'text-indigo-600 bg-indigo-100'
  };

  const progressColor = data.currentStatus?.percentage >= 100 ? 'bg-rose-500' :
    data.currentStatus?.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-6">
      {/* Main Goal Progress */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Monthly Goal Progress</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[data.currentStatus?.status]}`}>
            {data.currentStatus?.status?.replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-4">
          {/* Usage Goal */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600 dark:text-slate-400">Energy Usage</span>
              <span className="font-medium text-slate-900 dark:text-white">{data.currentStatus?.usedKWh} / {data.currentStatus?.targetKWh} kWh</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, data.currentStatus?.percentage || 0)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full ${progressColor} rounded-full`}
              />
            </div>
            <p className="text-right text-sm text-slate-500 mt-1">{data.currentStatus?.percentage}%</p>
          </div>

          {/* Cost Goal */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600 dark:text-slate-400">Budget Usage</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{data.currentStatus?.usedCost} / ₹{data.currentStatus?.targetCost}</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (data.currentStatus?.usedCost / data.currentStatus?.targetCost) * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full bg-indigo-500 rounded-full`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* All Goals List */}
      {data.allGoals?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">All Goals</h3>
          <div className="space-y-3">
            {data.allGoals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white capitalize">{goal.type} Goal</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{goal.target?.value} {goal.target?.unit}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[goal.status]}`}>
                  {goal.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Device Efficiency Section
const DeviceEfficiencySection = ({ data, loading }) => {
  if (loading || !data) {
    return <LoadingSkeleton />;
  }

  const getEfficiencyColor = (score) => {
    if (score >= 80) return 'emerald';
    if (score >= 60) return 'amber';
    return 'rose';
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <p className="text-white/80 text-sm">Efficient Devices</p>
          <p className="text-3xl font-bold">{data.categories?.efficient?.count || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
          <p className="text-white/80 text-sm">Moderate Devices</p>
          <p className="text-3xl font-bold">{data.categories?.moderate?.count || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white">
          <p className="text-white/80 text-sm">Inefficient Devices</p>
          <p className="text-3xl font-bold">{data.categories?.inefficient?.count || 0}</p>
        </div>
      </div>

      {/* Device Cards */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Device Efficiency Scores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.devices?.map((device) => {
            const colorName = getEfficiencyColor(device.efficiencyScore);
            return (
              <motion.div
                key={device.deviceId}
                whileHover={{ scale: 1.02 }}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-slate-400" />
                    <span className="font-medium text-slate-800 dark:text-white">{device.deviceName}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium bg-${colorName}-100 text-${colorName}-600`}>
                    {device.category}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Efficiency</span>
                    <span className={`font-bold text-${colorName}-600`}>{device.efficiencyScore}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${colorName}-500 rounded-full transition-all`}
                      style={{ width: `${device.efficiencyScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Cost: ₹{device.totalCost?.toFixed(2)}</span>
                    <span>{device.avgDailyUsage} kWh/day</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recommendation */}
      {data.summary?.topRecommendation && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-medium">{data.summary.topRecommendation}</p>
                <p className="text-white/80 text-sm mt-1">
                  Potential savings: ₹{data.summary.potentialMonthlySavings}/month
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Automation Impact Section
const AutomationImpactSection = ({ data, loading }) => {
  if (loading || !data) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Rules Triggered"
          value={data.rulesTriggered || 0}
          subtitle="This period"
          icon={Bot}
          color="primary"
        />
        <SummaryCard
          title="Estimated Savings"
          value={`₹${data.estimatedSavings?.toFixed(2) || 0}`}
          subtitle="From automation"
          icon={TrendingDown}
          color="success"
        />
        <SummaryCard
          title="Actual Savings"
          value={`₹${data.actualSavings?.toFixed(2) || 0}`}
          subtitle="Verified"
          icon={DollarSign}
          color="warning"
        />
      </div>

      {/* Top Rules */}
      {data.topRules?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Top Performing Rules</h3>
          <div className="space-y-3">
            {data.topRules.map((rule, index) => (
              <div key={rule.ruleId || index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{rule.ruleName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Triggered {rule.timesTriggered} times</p>
                  </div>
                </div>
                <span className="text-emerald-600 font-bold">₹{rule.savings?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-start gap-3">
          <Bot className="h-6 w-6 flex-shrink-0" />
          <p className="text-sm">{data.summary?.recommendation}</p>
        </div>
      </div>
    </div>
  );
};

// Forecast Section
const ForecastSection = ({ data, loading }) => {
  if (loading || !data) {
    return <LoadingSkeleton />;
  }

  const trendIcon = data.trend === 'increasing' ? TrendingUp :
    data.trend === 'decreasing' ? TrendingDown : Activity;
  const trendColor = data.trend === 'increasing' ? 'text-rose-500' :
    data.trend === 'decreasing' ? 'text-emerald-500' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Main Forecast Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">End of Month Forecast</h3>
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
            {data.confidence}% confidence
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-white/70 text-sm">Projected Cost</p>
            <p className="text-4xl font-bold mt-1">₹{data.projectedCost?.toFixed(0)}</p>
            <div className="flex items-center gap-2 mt-2">
              {React.createElement(trendIcon, { className: `h-5 w-5 ${trendColor}` })}
              <span className="capitalize">{data.trend} trend</span>
            </div>
          </div>
          <div>
            <p className="text-white/70 text-sm">Projected Usage</p>
            <p className="text-4xl font-bold mt-1">{data.projectedUsage?.toFixed(0)} kWh</p>
          </div>
        </div>

        {/* Budget Comparison */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="flex items-center justify-between">
            <span>Monthly Budget: ₹{data.budget}</span>
            <span className={data.willExceedBudget ? 'text-rose-300' : 'text-emerald-300'}>
              {data.willExceedBudget
                ? `Exceeds by ₹${Math.abs(data.budgetDifference).toFixed(0)}`
                : `Under by ₹${Math.abs(data.budgetDifference).toFixed(0)}`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${data.willExceedBudget ? 'bg-rose-100' : 'bg-emerald-100'}`}>
            {data.willExceedBudget
              ? <AlertTriangle className="h-6 w-6 text-rose-600" />
              : <TrendingDown className="h-6 w-6 text-emerald-600" />
            }
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-white">Recommendation</h4>
            <p className="text-slate-600 dark:text-slate-300 mt-1">{data.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Carbon Impact Section
const CarbonImpactSection = ({ data, loading }) => {
  if (loading || !data) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <Leaf className="h-8 w-8 mb-3" />
          <p className="text-white/80 text-sm">Carbon Footprint</p>
          <p className="text-3xl font-bold">{data.kgCO2?.toFixed(1)} kg</p>
          <p className="text-white/70 text-xs mt-1">CO₂ emissions</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <span className="text-3xl">🌳</span>
          <p className="text-white/80 text-sm mt-2">Trees Needed</p>
          <p className="text-3xl font-bold">{data.treesEquivalent?.toFixed(1)}</p>
          <p className="text-white/70 text-xs mt-1">to offset yearly</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white">
          <Activity className="h-8 w-8 mb-3" />
          <p className="text-white/80 text-sm">vs Average</p>
          <p className="text-3xl font-bold">
            {data.comparedToAverage > 0 ? '+' : ''}{data.comparedToAverage}%
          </p>
          <p className="text-white/70 text-xs mt-1">household comparison</p>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Tips to Reduce Your Carbon Footprint</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.tips?.map((tip, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <span className="text-2xl">💡</span>
              <p className="text-sm text-slate-700 dark:text-slate-300">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-slate-100 dark:bg-slate-700/50 rounded"></div>
      </div>
    ))}
  </div>
);

// Main Reports Component
const Reports = () => {
  const [activeReport, setActiveReport] = useState('overview');
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [costData, setCostData] = useState(null);
  const [peakData, setPeakData] = useState(null);
  const [goalData, setGoalData] = useState(null);
  const [efficiencyData, setEfficiencyData] = useState(null);
  const [automationData, setAutomationData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [carbonData, setCarbonData] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('both');
  const [exporting, setExporting] = useState(false);

  // Fetch data based on active report and period
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        switch (activeReport) {
          case 'overview':
            const summary = await reportService.getSummary(period);
            setReportData(summary);
            break;
          case 'cost':
            const cost = await reportService.getCostBreakdown(period);
            setCostData(cost);
            break;
          case 'peak':
            const peak = await reportService.getPeakHours(period);
            setPeakData(peak);
            break;
          case 'goals':
            const goals = await reportService.getGoalProgress(period);
            setGoalData(goals);
            break;
          case 'efficiency':
            const efficiency = await reportService.getDeviceEfficiency(period);
            setEfficiencyData(efficiency);
            break;
          case 'automation':
            const automation = await reportService.getAutomationImpact(period);
            setAutomationData(automation);
            break;
          case 'forecast':
            const forecast = await reportService.getForecast();
            setForecastData(forecast);
            break;
          case 'carbon':
            const carbon = await reportService.getCarbonImpact(period);
            setCarbonData(carbon);
            break;
        }
      } catch (error) {
        console.error('Failed to fetch report data:', error);
        toast.error('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeReport, period]);

  // Render active report content
  const renderReportContent = () => {
    switch (activeReport) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Cost"
                value={`₹${reportData?.summary?.totalCost?.toFixed(0) || 0}`}
                subtitle={`Avg ₹${reportData?.summary?.avgDailyCost?.toFixed(0) || 0}/day`}
                icon={DollarSign}
                color="primary"
              />
              <SummaryCard
                title="Energy Used"
                value={`${reportData?.summary?.totalEnergy?.toFixed(1) || 0} kWh`}
                subtitle={`Avg ${reportData?.summary?.avgDailyUsage?.toFixed(1) || 0} kWh/day`}
                icon={Zap}
                color="warning"
              />
              <SummaryCard
                title="Goal Progress"
                value={`${reportData?.goalStatus?.percentage || 0}%`}
                subtitle={reportData?.goalStatus?.status?.replace('_', ' ')}
                icon={Target}
                color={reportData?.goalStatus?.percentage >= 80 ? 'danger' : 'success'}
              />
              <SummaryCard
                title="Savings"
                value={`₹${reportData?.summary?.savingsVsPrevious?.toFixed(0) || 0}`}
                subtitle={`${reportData?.summary?.savingsPercentage || 0}% saved`}
                icon={TrendingDown}
                color="success"
              />
            </div>

            {/* Usage Trend Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Device Usage Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData?.deviceStats?.slice(0, 8) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="deviceName" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tickFormatter={(v) => `₹${v}`} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}kWh`} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'totalCost' ? `₹${value.toFixed(2)}` : `${(value / 1000).toFixed(2)} kWh`,
                      name === 'totalCost' ? 'Cost' : 'Usage'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalCost" fill="#6366f1" name="Cost (₹)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="totalWh" fill="#22c55e" name="Usage (Wh)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recommendations */}
            {reportData?.recommendations?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Top Recommendations</h3>
                <div className="space-y-3">
                  {reportData.recommendations.slice(0, 4).map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border-l-4 ${rec.priority === 'high' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' :
                        rec.priority === 'medium' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' :
                          'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{rec.title}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{rec.description}</p>
                        </div>
                        <span className="text-emerald-600 font-bold whitespace-nowrap ml-4">
                          Save ₹{rec.potentialSavings}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'cost':
        return <CostBreakdownSection data={costData} loading={loading} />;
      case 'peak':
        return <PeakHoursSection data={peakData} loading={loading} />;
      case 'goals':
        return <GoalProgressSection data={goalData} loading={loading} />;
      case 'efficiency':
        return <DeviceEfficiencySection data={efficiencyData} loading={loading} />;
      case 'automation':
        return <AutomationImpactSection data={automationData} loading={loading} />;
      case 'forecast':
        return <ForecastSection data={forecastData} loading={loading} />;
      case 'carbon':
        return <CarbonImpactSection data={carbonData} loading={loading} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
            <p className="text-slate-600 mt-1">Detailed energy usage analytics and insights</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPeriod(opt.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === opt.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !exporting && setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Export Report Bundle</h3>
                {!exporting && (
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Period info */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-sm text-slate-500">Period</div>
                  <div className="font-medium text-slate-800">
                    {period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'This Month'}
                  </div>
                </div>

                {/* Format selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Format</label>
                  <div className="space-y-2">
                    {[
                      { id: 'pdf', label: 'PDF Summary', desc: 'Charts, insights & visual overview' },
                      { id: 'xlsx', label: 'Excel Data Pack', desc: 'Raw data in spreadsheet format' },
                      { id: 'both', label: 'Both (Recommended)', desc: 'Complete bundle for all use cases' }
                    ].map(opt => (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${exportFormat === opt.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name="exportFormat"
                          value={opt.id}
                          checked={exportFormat === opt.id}
                          onChange={() => setExportFormat(opt.id)}
                          className="accent-indigo-600"
                        />
                        <div>
                          <div className="font-medium text-slate-800">{opt.label}</div>
                          <div className="text-xs text-slate-500">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={exporting}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setExporting(true);
                    try {
                      if (exportFormat === 'pdf') {
                        await exportService.downloadPDF(period);
                        toast.success('PDF downloaded!');
                      } else if (exportFormat === 'xlsx') {
                        await exportService.downloadXLSX(period);
                        toast.success('Excel file downloaded!');
                      } else {
                        await exportService.downloadBoth(period);
                        toast.success('Report bundle downloaded!');
                      }
                      setShowExportModal(false);
                    } catch (error) {
                      console.error('Export error:', error);
                      toast.error('Export failed. Please try again.');
                    } finally {
                      setExporting(false);
                    }
                  }}
                  disabled={exporting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-70"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-64 flex-shrink-0"
        >
          <div className="bg-white rounded-2xl shadow-lg p-4 lg:sticky lg:top-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
              Report Types
            </h3>
            <nav className="space-y-1">
              {REPORT_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = activeReport === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setActiveReport(type.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{type.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Report Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeReport}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {loading && activeReport === 'overview' ? <LoadingSkeleton /> : renderReportContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;
