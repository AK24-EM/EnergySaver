import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Clock,
  Settings,
  Plus,
  Trash2,
  Power,
  Moon,
  Home,
  Leaf,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { fetchRules, fetchModes, activateMode, fetchLogs, deleteRule, undoAction, createRule } from '../store/slices/automationSlice';
import toast from 'react-hot-toast';

const Automation = () => {
  const dispatch = useDispatch();
  const { rules, modes, logs } = useSelector((state) => state.automation);
  const devices = useSelector((state) => state.devices.devices) || [];
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [selectedTab, setSelectedTab] = useState('modes'); // 'modes', 'rules', 'logs'

  useEffect(() => {
    dispatch(fetchRules());
    dispatch(fetchModes());
    dispatch(fetchLogs(20));
  }, [dispatch]);

  const handleActivateMode = async (modeId) => {
    try {
      const result = await dispatch(activateMode(modeId)).unwrap();
      toast.success(result.message || `${modeId} mode activated`);
      dispatch(fetchLogs(20)); // Refresh logs
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to activate mode';
      toast.error(errorMessage);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await dispatch(deleteRule(ruleId)).unwrap();
        toast.success('Rule deleted successfully');
      } catch (error) {
        const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to delete rule';
        toast.error(errorMessage);
      }
    }
  };

  const handleUndoAction = async (logId) => {
    try {
      await dispatch(undoAction(logId)).unwrap();
      toast.success('Action undone successfully');
      dispatch(fetchLogs(20)); // Refresh logs
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to undo action';
      toast.error(errorMessage);
    }
  };

  const getModeIcon = (modeId) => {
    switch (modeId) {
      case 'away': return Home;
      case 'sleep': return Moon;
      case 'eco': return Leaf;
      default: return Zap;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Automation</h1>
        <p className="text-slate-600">Smart automation that respects your preferences</p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b border-slate-200">
        {[
          { id: 'modes', label: 'One-Tap Modes', icon: Zap },
          { id: 'rules', label: 'Automation Rules', icon: Settings },
          { id: 'logs', label: 'Action Log', icon: Clock }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${selectedTab === tab.id
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
          >
            <tab.icon className="h-5 w-5" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* One-Tap Modes */}
      {selectedTab === 'modes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((mode, index) => {
            const Icon = getModeIcon(mode.id);
            return (
              <motion.div
                key={mode.id}
                className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <span className="text-2xl">{mode.icon}</span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">{mode.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{mode.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Estimated Savings:</span>
                    <span className="font-semibold text-green-600">{mode.estimatedSavings}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium text-slate-700 mb-2">Actions:</p>
                  <ul className="space-y-1">
                    {mode.actions.map((action, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleActivateMode(mode.id)}
                  className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Activate {mode.name}</span>
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Automation Rules */}
      {selectedTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-slate-600">
              {rules.length === 0 ? 'No automation rules yet' : `${rules.length} active rule${rules.length !== 1 ? 's' : ''}`}
            </p>
            <button
              onClick={() => setShowRuleBuilder(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Rule</span>
            </button>
          </div>

          {rules.length === 0 ? (
            <motion.div
              className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Settings className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Automation Rules</h3>
              <p className="text-slate-600 mb-6">Create your first automation rule to get started</p>
              <button
                onClick={() => setShowRuleBuilder(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create Your First Rule
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rules.map((rule) => (
                <motion.div
                  key={rule._id}
                  className="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{rule.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${rule.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                          {rule.enabled ? 'Active' : 'Paused'}
                        </span>
                      </div>

                      {rule.description && (
                        <p className="text-sm text-slate-600 mb-3">{rule.description}</p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {rule.trigger.type === 'time' && rule.trigger.schedule
                              ? `${rule.trigger.schedule.hour}:${rule.trigger.schedule.minute.toString().padStart(2, '0')}`
                              : rule.trigger.type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Zap className="h-4 w-4" />
                          <span>{rule.action.devices.length} device{rule.action.devices.length !== 1 ? 's' : ''}</span>
                        </div>
                        {rule.metadata.triggerCount > 0 && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{rule.metadata.successRate.toFixed(0)}% success rate</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteRule(rule._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Log */}
      {selectedTab === 'logs' && (
        <div className="space-y-4">
          <p className="text-slate-600">
            {logs.length === 0 ? 'No automation actions yet' : `Last ${logs.length} actions`}
          </p>

          {logs.length === 0 ? (
            <motion.div
              className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Clock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Actions Yet</h3>
              <p className="text-slate-600">Automation actions will appear here</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <motion.div
                  key={log._id}
                  className="bg-white rounded-xl shadow-md border border-slate-200 p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {log.executed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-slate-400" />
                        )}
                        <span className="font-medium text-slate-900">
                          {log.action.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-sm text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 mb-2">{log.reasoning}</p>

                      {log.executed && log.estimatedImpact && (
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span>{log.estimatedImpact.affectedDevices} device{log.estimatedImpact.affectedDevices !== 1 ? 's' : ''}</span>
                          {log.estimatedImpact.savings && (
                            <span className="text-green-600">~₹{log.estimatedImpact.savings.toFixed(2)} saved</span>
                          )}
                        </div>
                      )}

                      {!log.executed && log.skipReason && (
                        <div className="flex items-center space-x-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          <AlertCircle className="h-3 w-3" />
                          <span>{log.skipReason}</span>
                        </div>
                      )}
                    </div>

                    {log.executed && !log.userResponse && (
                      <button
                        onClick={() => handleUndoAction(log._id)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Undo this action"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </button>
                    )}

                    {log.userResponse?.type === 'undone' && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        Undone
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rule Builder Modal */}
      <AnimatePresence>
        {showRuleBuilder && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRuleBuilder(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Automation Rule</h2>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);

                const ruleData = {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  enabled: true,
                  priority: 5,
                  trigger: {
                    type: 'time',
                    schedule: {
                      hour: parseInt(formData.get('hour')),
                      minute: parseInt(formData.get('minute')),
                      days: formData.getAll('days')
                    }
                  },
                  action: {
                    type: formData.get('actionType'),
                    devices: formData.getAll('devices')
                  },
                  constraints: {
                    minSavings: 5
                  }
                };

                try {
                  await dispatch(createRule(ruleData)).unwrap();
                  toast.success('Rule created successfully!');
                  setShowRuleBuilder(false);
                } catch (error) {
                  const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to create rule';
                  toast.error(errorMessage);
                }
              }}>
                {/* Rule Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g., Turn off AC at night"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="2"
                    placeholder="Optional description"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Time Trigger */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    When should this run? *
                  </label>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-600 mb-1">Hour</label>
                      <input
                        type="number"
                        name="hour"
                        min="0"
                        max="23"
                        required
                        defaultValue="22"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-slate-600 mb-1">Minute</label>
                      <input
                        type="number"
                        name="minute"
                        min="0"
                        max="59"
                        required
                        defaultValue="0"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Days of Week */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Days of Week
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <label key={day} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="days"
                          value={day}
                          defaultChecked
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-slate-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Action Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Action *
                  </label>
                  <select
                    name="actionType"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="turn_off">Turn Off</option>
                    <option value="turn_on">Turn On</option>
                    <option value="set_mode">Set to Eco Mode</option>
                  </select>
                </div>

                {/* Device Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Which devices? *
                  </label>
                  <div className="border border-slate-300 rounded-lg p-4 max-h-40 overflow-y-auto">
                    {devices.map((device) => (
                      <label key={device._id} className="flex items-center space-x-2 mb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="devices"
                          value={device._id}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-slate-700">{device.name} ({device.category})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowRuleBuilder(false)}
                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Create Rule
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Automation;
