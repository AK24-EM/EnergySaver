import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Power,
  Activity,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Zap,
  Thermometer,
  Tv,
  Lightbulb,
  Wifi,
  Trash2,
  MoreVertical,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Settings
} from 'lucide-react';
import { fetchDevices, addDevice, updateDevice, deleteDevice, turnOffIdleDevices, fetchDeviceStats, clearDeviceStats } from '../store/slices/deviceSlice';
import deviceService from '../services/deviceService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Devices = () => {
  const dispatch = useDispatch();
  const { devices, isLoading, deviceStats, isStatsLoading } = useSelector((state) => state.devices);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    if (showAddModal) {
      deviceService.getTemplates().then(res => setTemplates(res.data.templates)).catch(err => console.error(err));
    }
  }, [showAddModal]);

  // Add Device Form State
  const [step, setStep] = useState(1);
  const [editingDevice, setEditingDevice] = useState(null); // Track device being edited
  const [newDevice, setNewDevice] = useState({
    name: '',
    category: '',
    room: '',
    ratedPower: '',
    dailyUsageGoal: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // Device info for delete confirmation

  const handleTurnOffIdle = async () => {
    try {
      const result = await dispatch(turnOffIdleDevices()).unwrap();
      toast.success(result || 'Idle devices turned off');
    } catch (error) {
      toast.error('Failed to turn off idle devices');
    }
  };

  useEffect(() => {
    dispatch(fetchDevices());
  }, [dispatch]);

  // Categories with Icons
  const categories = [
    { id: 'AC', name: 'Air Conditioner', icon: Thermometer, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'Lighting', name: 'Lighting', icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { id: 'Entertainment', name: 'Entertainment', icon: Tv, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'Kitchen', name: 'Kitchen', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'Other', name: 'Other', icon: Wifi, color: 'text-gray-500', bg: 'bg-gray-50' },
  ];

  // Filtering Logic
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || device.category === filterCategory;
    const matchesStatus = filterStatus === 'All'
      ? true
      : filterStatus === 'Active' ? device.isActive
        : !device.isActive;
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => (b.currentPower || 0) - (a.currentPower || 0)); // Sort by Power High-Low

  // Handlers
  const handleToggle = async (e, device) => {
    e.stopPropagation();
    try {
      await dispatch(updateDevice({
        id: device._id,
        data: { isActive: !device.isActive }
      })).unwrap();
      toast.success(`${device.name} turned ${!device.isActive ? 'ON' : 'OFF'}`);
    } catch (error) {
      toast.error('Failed to update device');
    }
  };

  const handleSaveDevice = async () => {
    try {
      const deviceData = {
        name: newDevice.name,
        category: newDevice.category,
        room: newDevice.room || 'Living Room',
        location: {
          room: newDevice.room || 'Living Room',
          floor: 'Ground' // Default
        },
        ratedPower: Number(newDevice.ratedPower) || 100, // Top-level
      };

      if (editingDevice) {
        await dispatch(updateDevice({
          id: editingDevice._id,
          data: deviceData
        })).unwrap();
        toast.success('Device updated successfully');
      } else {
        await dispatch(addDevice({
          ...deviceData,
          status: 'off',
          isActive: false,
          currentPower: 0
        })).unwrap();
        toast.success('Device added successfully');
      }

      setShowAddModal(false);
      setEditingDevice(null);
      setNewDevice({ name: '', category: '', room: '', ratedPower: '', dailyUsageGoal: '' });
      setStep(1);
    } catch (error) {
      console.error('Failed to save device:', error);
      toast.error(error?.message || 'Failed to save device');
    }
  };

  const handleEditClick = (e, device) => {
    e.stopPropagation();
    setEditingDevice(device);
    setNewDevice({
      name: device.name,
      category: device.category,
      room: device.room || device.location?.room || '',
      ratedPower: device.ratedPower,
      dailyUsageGoal: device.dailyUsageGoal || ''
    });
    setStep(2); // Skip category selection for edit, or go to 1 if you want to allow changing category
    setShowAddModal(true);
  };

  const handleDeleteClick = (e, device) => {
    e.stopPropagation();
    setShowDeleteConfirm(device);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      await dispatch(deleteDevice(showDeleteConfirm._id)).unwrap();
      toast.success('Device deleted successfully');
      setShowDeleteConfirm(null);
      if (showDetailModal?._id === showDeleteConfirm._id) {
        setShowDetailModal(null);
      }
    } catch (error) {
      toast.error('Failed to delete device');
    }
  };

  const handleAutomationUpdate = async (device, type, settings, enabled) => {
    try {
      const response = await deviceService.updateAutomation(device._id, type, settings, enabled);

      // Update local state without fetching all devices
      const updatedDevice = response.device;

      // Update modal state
      setShowDetailModal(prev => ({
        ...prev,
        automation: updatedDevice.automation
      }));

      // Update redundant list state if necessary (though specific details usually fetched on open)
      // Dispatch update to Redux store to keep list in sync
      dispatch({
        type: 'devices/updateDevice/fulfilled',
        payload: { id: updatedDevice._id, device: updatedDevice }
      });

      toast.success('Automation settings saved');
    } catch (error) {
      console.error('Automation update failed:', error);
      toast.error('Failed to update automation settings');
    }
  };

  // --- Components ---

  const DeviceMenu = ({ device }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 overflow-hidden"
              >
                <button
                  onClick={(e) => {
                    setIsOpen(false);
                    handleEditClick(e, device);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Edit Device</span>
                </button>
                <button
                  onClick={(e) => {
                    setIsOpen(false);
                    handleDeleteClick(e, device);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Device</span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const DeviceCard = ({ device }) => {
    const CategoryIcon = categories.find(c => c.id === device.category)?.icon || Smartphone;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        onClick={() => {
          setShowDetailModal(device);
          dispatch(fetchDeviceStats(device._id));
        }}
        className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-5 cursor-pointer transition-all duration-200 ${device.isActive ? 'border-primary-200 dark:border-primary-900 shadow-md' : 'border-slate-200 dark:border-slate-700'
          }`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${device.isActive ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-400'}`}>
            <CategoryIcon className="w-6 h-6" />
          </div>
          <div className="flex items-center space-x-2">
            {device.isActive && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
            <DeviceMenu device={device} />
            <button
              onClick={(e) => handleToggle(e, device)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${device.isActive ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-600'
                }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${device.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-lg truncate">{device.name}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{device.category} • {device.room || 'General'}</p>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Power</p>
              <p className={`font-semibold ${device.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                {device.isActive ? `${device.currentPower || 0}W` : '-'}
              </p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-600"></div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Cost/hr</p>
              <p className={`font-semibold ${device.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                {device.isActive ? `₹${((device.currentPower || 0) / 1000 * 5.5).toFixed(2)}` : '-'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const DeviceListItem = ({ device }) => {
    const CategoryIcon = categories.find(c => c.id === device.category)?.icon || Smartphone;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => {
          setShowDetailModal(device);
          dispatch(fetchDeviceStats(device._id));
        }}
        className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-lg ${device.isActive ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
            <CategoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{device.name}</h4>
            <p className="text-xs text-slate-500">{device.category} - {device.room || 'General'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900">{device.isActive ? `${device.currentPower} W` : '0 W'}</p>
            <p className="text-xs text-slate-500">Live Usage</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-slate-900">₹{((device.currentPower / 1000) * 5.5 * 24).toFixed(0)}</p>
            <p className="text-xs text-slate-500">Est. Monthly</p>
          </div>
          <div className="flex items-center space-x-2">
            <DeviceMenu device={device} />
            <button
              onClick={(e) => handleToggle(e, device)}
              className={`p-2 rounded-full transition-colors ${device.isActive ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
            >
              <Power className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Loading State
  if (isLoading && devices.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Device Manager</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor and optimize your {devices.length} connected devices</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleTurnOffIdle}
            className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Power className="w-4 h-4" />
            <span>Turn Off Idle</span>
          </button>
          <button
            onClick={() => {
              setEditingDevice(null);
              setNewDevice({ name: '', category: '', room: '', ratedPower: '', dailyUsageGoal: '' });
              setStep(1);
              setShowAddModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Device</span>
          </button>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-9 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none appearance-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Device List/Grid */}
      {filteredDevices.length > 0 ? (
        <motion.div
          layout
          className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}
        >
          <AnimatePresence>
            {filteredDevices.map(device => (
              viewMode === 'grid'
                ? <DeviceCard key={device._id} device={device} />
                : <DeviceListItem key={device._id} device={device} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <Search className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No devices found</h3>
          <p className="text-slate-500">Try adjusting your filters or add a new device.</p>
        </div>
      )}

      {/* --- ADD/EDIT DEVICE MODAL --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingDevice
                    ? 'Edit Device'
                    : step === 1 ? 'Choose Category' : step === 2 ? 'Detail Setup' : 'Add Device'
                  }
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {step === 1 && !editingDevice ? (
                  <div className="space-y-6">
                    {/* Templates Section */}
                    {templates.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Add from Templates</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {templates.map(tpl => (
                            <button
                              key={tpl._id}
                              onClick={() => {
                                setNewDevice({
                                  ...newDevice,
                                  name: tpl.defaultName || tpl.name,
                                  category: tpl.category,
                                  ratedPower: tpl.ratedPower
                                });
                                setStep(2);
                              }}
                              className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50 transition-all text-left group"
                            >
                              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white text-slate-600 group-hover:text-primary-600">
                                <Zap className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 text-sm truncate">{tpl.name}</p>
                                <p className="text-xs text-slate-500">{tpl.ratedPower}W</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Or Choose Category</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setNewDevice({ ...newDevice, category: cat.id });
                              setStep(2);
                            }}
                            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 ${newDevice.category === cat.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-700'}`}
                          >
                            <div className={`p-3 rounded-full ${cat.bg} ${cat.color} mb-3`}>
                              <cat.icon className="w-6 h-6" />
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white">{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Device Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="e.g. Master Bedroom AC"
                        value={newDevice.name}
                        onChange={e => setNewDevice({ ...newDevice, name: e.target.value })}
                      />
                    </div>
                    {/* Only allow changing category if we are adding, or implement re-select for edit mostly unnecessary */}
                    {editingDevice && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                        <select
                          value={newDevice.category}
                          onChange={(e) => setNewDevice({ ...newDevice, category: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Room</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          placeholder="Living Room"
                          value={newDevice.room}
                          onChange={e => setNewDevice({ ...newDevice, room: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rated Power (W)</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          placeholder="1500"
                          value={newDevice.ratedPower}
                          onChange={e => setNewDevice({ ...newDevice, ratedPower: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3">
                      <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800">
                        Tip: Accurate rated power helps us calculate cost savings better.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3">
                {step === 2 && !editingDevice && (
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                )}
                {(step === 2 || editingDevice) && (
                  <button
                    onClick={handleSaveDevice}
                    disabled={!newDevice.name}
                    className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {editingDevice ? 'Save Changes' : 'Add Device'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM DELETE MODAL --- */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Device?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? This action cannot be undone and will delete all usage history.
                </p>
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Device
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DEVICE DETAIL MODAL --- */}
      <AnimatePresence>
        {showDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="relative h-32 bg-gradient-to-r from-primary-500 to-secondary-500 p-6 flex flex-col justify-end">
                <button
                  onClick={() => {
                    setShowDetailModal(null);
                    dispatch(clearDeviceStats());
                  }}
                  className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur-sm transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-white">{showDetailModal.name}</h2>
                <div className="flex items-center text-white/90 text-sm space-x-2">
                  <span>{showDetailModal.category}</span>
                  <span>•</span>
                  <span>{showDetailModal.room || 'General'}</span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Status & Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full ${showDetailModal.status.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-200 dark:bg-slate-600 text-slate-500'}`}>
                      <Power className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Device Status</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{showDetailModal.status.isActive ? 'Active & Consuming Power' : 'Turned Off'}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleToggle(e, showDetailModal)}
                    className={`px-5 py-2 rounded-lg font-medium transition-colors ${showDetailModal.status.isActive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                  >
                    {showDetailModal.status.isActive ? 'Turn Off' : 'Turn On'}
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-300 mb-1">Live Power</p>
                    <div className="flex items-end space-x-1">
                      <span className="text-xl font-bold text-slate-900 dark:text-white">{showDetailModal.status.currentPower || 0}</span>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">W</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-300 mb-1">Daily Cost</p>
                    <div className="flex items-end space-x-1">
                      {isStatsLoading ? (
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-600 animate-pulse rounded"></div>
                      ) : (
                        <>
                          <span className="text-xl font-bold text-slate-900 dark:text-white">
                            ₹{deviceStats?.dailyUsage?.[0]?.totalCost?.toFixed(2) || '0.00'}
                          </span>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">est.</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-300 mb-1">Usage Today</p>
                    <div className="flex items-end space-x-1">
                      {isStatsLoading ? (
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-600 animate-pulse rounded"></div>
                      ) : (
                        <>
                          <span className="text-xl font-bold text-slate-900 dark:text-white">
                            {deviceStats?.dailyUsage?.[0]?.totalKwh?.toFixed(1) || '0.0'}
                          </span>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">kWh</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mock Insights */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Smart Insights
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                      <TrendingUp className="w-5 h-5 flex-shrink-0" />
                      <p>Usage is 10% higher than last week. Consider reducing usage during peak hours (6-9 PM).</p>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                      <Clock className="w-5 h-5 flex-shrink-0" />
                      <p>This device has been running for 4 hours continuously.</p>
                    </div>
                  </div>
                </div>

                {/* Settings & Automation */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Automation & Limits
                  </h4>
                  <div className="space-y-4">
                    {/* Daily Limit */}
                    <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">Daily Limit</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {showDetailModal.automation?.dailyLimit?.enabled
                              ? `Active: ${showDetailModal.automation.dailyLimit.threshold} kWh`
                              : 'Disabled'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAutomationUpdate(showDetailModal, 'dailyLimit', {}, !showDetailModal.automation?.dailyLimit?.enabled)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showDetailModal.automation?.dailyLimit?.enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'
                            }`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showDetailModal.automation?.dailyLimit?.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </button>
                      </div>

                      {showDetailModal.automation?.dailyLimit?.enabled && (
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Max kWh"
                            defaultValue={showDetailModal.automation?.dailyLimit?.threshold}
                            className="w-24 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                            onBlur={(e) => handleAutomationUpdate(showDetailModal, 'dailyLimit', { threshold: parseFloat(e.target.value) })}
                          />
                          <span className="text-sm text-slate-500">kWh</span>
                        </div>
                      )}
                    </div>

                    {/* Schedule */}
                    <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">Schedule</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {showDetailModal.automation?.schedule?.enabled
                              ? `On: ${showDetailModal.automation.schedule.startTime} - ${showDetailModal.automation.schedule.endTime}`
                              : 'Disabled'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAutomationUpdate(showDetailModal, 'schedule', {}, !showDetailModal.automation?.schedule?.enabled)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showDetailModal.automation?.schedule?.enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'
                            }`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showDetailModal.automation?.schedule?.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </button>
                      </div>

                      {showDetailModal.automation?.schedule?.enabled && (
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Start Time</label>
                            <input
                              type="time"
                              defaultValue={showDetailModal.automation?.schedule?.startTime}
                              className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                              onBlur={(e) => handleAutomationUpdate(showDetailModal, 'schedule', { startTime: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">End Time</label>
                            <input
                              type="time"
                              defaultValue={showDetailModal.automation?.schedule?.endTime}
                              className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                              onBlur={(e) => handleAutomationUpdate(showDetailModal, 'schedule', { endTime: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Devices;
