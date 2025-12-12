import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Home, Activity, Plus, Edit2, Trash2,
  Search, Save, X, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'templates'
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null); // Add analytics state
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Template Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'Other',
    ratedPower: '',
    defaultName: '',
    icon: 'zap'
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'overview') {
        const [statsData, analyticsData] = await Promise.all([
          adminService.getStats(),
          adminService.getAnalytics('7d')
        ]);
        setStats(statsData.stats);
        setAnalytics(analyticsData.analytics);
      } else if (activeTab === 'templates') {
        const data = await adminService.getTemplates();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      // toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await adminService.updateTemplate(editingTemplate._id, templateForm);
        toast.success('Template updated');
      } else {
        await adminService.createTemplate(templateForm);
        toast.success('Template created');
      }
      setShowTemplateModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await adminService.deleteTemplate(id);
      toast.success('Template deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const openModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        name: template.name,
        category: template.category,
        ratedPower: template.ratedPower,
        defaultName: template.defaultName || '',
        icon: template.icon || 'zap'
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({
        name: '',
        category: 'Other',
        ratedPower: '',
        defaultName: '',
        icon: 'zap'
      });
    }
    setShowTemplateModal(true);
  };

  const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">Manage the energy saver platform</p>
        </motion.div>

        <div className="flex space-x-2 bg-white p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'overview' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'templates' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Device Templates
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              icon={Users}
              color="text-primary-600"
              label="Users"
              value={stats?.totalUsers || 0}
              sub="Total registered users"
              delay={0.1}
            />
            <StatsCard
              icon={Home}
              color="text-secondary-600"
              label="Homes"
              value={stats?.totalHomes || 0}
              sub="Connected homes"
              delay={0.2}
            />
            <StatsCard
              icon={Activity}
              color="text-green-600"
              label="Devices"
              value={stats?.totalDevices || 0}
              sub="Total devices"
              delay={0.3}
            />
            <StatsCard
              icon={Shield}
              color="text-red-600"
              label="Usage Today"
              value={`${(stats?.todayUsage?.totalKwh || 0).toFixed(1)} kWh`}
              sub={`₹${(stats?.todayUsage?.totalCost || 0).toFixed(0)} est. cost`}
              delay={0.4}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Usage Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
            >
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Device Category Consumption (7 Days)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.categoryUsage || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" orientation="left" stroke="#0ea5e9" />
                    <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="totalKwh" name="Energy (kWh)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="totalCost" name="Cost (₹)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Peak Hours Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
            >
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Peak Usage Hours</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.peakHours || []}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="_id" name="Hour" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Tooltip
                      labelFormatter={(value) => `${value}:00`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="totalCost" name="Cost (₹)" stroke="#f97316" fillOpacity={1} fill="url(#colorCost)" />
                    <Area type="monotone" dataKey="avgPower" name="Avg Power (W)" stroke="#8b5cf6" fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-800">Device Templates</h2>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <motion.div
                key={template._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Zap className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{template.name}</h3>
                      <p className="text-xs text-slate-500">{template.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(template)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 text-sm text-slate-600">
                  <span>{template.ratedPower} W</span>
                  <span>{template.defaultName || '-'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* TEMPLATE MODAL */}
      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingTemplate ? 'Edit Template' : 'New Template'}
                </h3>
                <button onClick={() => setShowTemplateModal(false)}>
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    required
                    value={templateForm.name}
                    onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="e.g. 5-Star AC 1.5 Ton"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select
                      value={templateForm.category}
                      onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      {['AC', 'Refrigerator', 'Washing Machine', 'TV', 'Light', 'Fan', 'Heater', 'Microwave', 'Computer', 'Kitchen', 'Entertainment', 'Other'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rated Power (W)</label>
                    <input
                      type="number"
                      required
                      value={templateForm.ratedPower}
                      onChange={e => setTemplateForm({ ...templateForm, ratedPower: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Default Name (Optional)</label>
                  <input
                    type="text"
                    value={templateForm.defaultName}
                    onChange={e => setTemplateForm({ ...templateForm, defaultName: e.target.value })}
                    placeholder="e.g. Bedroom AC"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                  >
                    Save Template
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatsCard = ({ icon: Icon, color, label, value, sub, delay }) => (
  <motion.div
    className="bg-white rounded-lg shadow-md p-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
  >
    <Icon className={`h-8 w-8 ${color} mb-4`} />
    <h3 className="text-lg font-semibold text-slate-900 mb-2">{label}</h3>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
    <p className="text-sm text-slate-600">{sub}</p>
  </motion.div>
);

export default AdminDashboard;

