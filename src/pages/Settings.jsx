import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Home, DollarSign, LayoutGrid, Users, Bell, Plug,
  Edit2, Save, Plus, Trash2, X, Check, Clock,
  MapPin, Globe, Calendar, Zap, Shield, ChevronRight,
  Mail, Smartphone, MessageSquare, Moon, Sun, UserPlus,
  Crown, Eye, Baby, Settings as SettingsIcon
} from 'lucide-react';
import settingsService from '../services/settingsService';

// Timezone options
const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
];

// Zone options for rooms
const ZONES = [
  { value: 'living', label: 'Living Space', color: 'bg-blue-100 text-blue-700' },
  { value: 'sleeping', label: 'Sleeping', color: 'bg-purple-100 text-purple-700' },
  { value: 'utility', label: 'Utility', color: 'bg-orange-100 text-orange-700' },
  { value: 'outdoor', label: 'Outdoor', color: 'bg-green-100 text-green-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' }
];

// Role options
const ROLES = [
  { value: 'admin', label: 'Admin', icon: Shield, desc: 'Full control except ownership transfer' },
  { value: 'member', label: 'Member', icon: Users, desc: 'Can control devices and view reports' },
  { value: 'viewer', label: 'Viewer', icon: Eye, desc: 'View-only access' },
  { value: 'child', label: 'Child', icon: Baby, desc: 'Limited device control' }
];

// Settings Sidebar Navigation
const SettingsSidebar = ({ activeSection, setActiveSection }) => {
  const sections = [
    { id: 'home', label: 'Home Profile', icon: Home, color: 'text-blue-600' },
    { id: 'tariff', label: 'Tariff & Billing', icon: DollarSign, color: 'text-green-600' },
    { id: 'rooms', label: 'Rooms & Zones', icon: LayoutGrid, color: 'text-purple-600' },
    { id: 'members', label: 'Members', icon: Users, color: 'text-orange-600' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-yellow-600' },
    { id: 'integrations', label: 'Integrations', icon: Plug, color: 'text-gray-400', disabled: true }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 h-fit sticky top-4">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 px-2">Settings</h2>
      <nav className="space-y-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => !section.disabled && setActiveSection(section.id)}
            disabled={section.disabled}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${activeSection === section.id
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
              : section.disabled
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
          >
            <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-indigo-600' : section.color}`} />
            <span className="font-medium">{section.label}</span>
            {section.disabled && (
              <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Soon</span>
            )}
            {activeSection === section.id && !section.disabled && (
              <ChevronRight className="w-4 h-4 ml-auto text-indigo-400" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

// Toggle Switch Component
const Toggle = ({ enabled, onChange, label }) => (
  <button
    onClick={() => onChange(!enabled)}
    className="flex items-center gap-3 group"
  >
    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-600'
      }`}>
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'
        }`} />
    </div>
    {label && <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{label}</span>}
  </button>
);

// Home Profile Section
const HomeProfileSection = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    photo: '',
    address: '',
    timezone: 'Asia/Kolkata',
    region: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await settingsService.getHomeProfile();
      setProfile(data);
    } catch (error) {
      toast.error('Failed to load home profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateHomeProfile(profile);
      toast.success('Home profile updated');
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SettingsLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Home Profile</h2>
          <p className="text-slate-500 dark:text-slate-400">Basic information about your home</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 space-y-6">
        {/* Home Photo */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {profile.name?.charAt(0) || 'H'}
          </div>
          <div>
            <h3 className="font-medium text-slate-800 dark:text-white mb-1">Home Photo</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Optional photo for your home</p>
            <input
              type="url"
              placeholder="Enter image URL"
              value={profile.photo}
              onChange={(e) => setProfile({ ...profile, photo: e.target.value })}
              className="text-sm px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Home Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Home Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="My Smart Home"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Globe className="w-4 h-4 inline mr-1" /> Timezone
            </label>
            <select
              value={profile.timezone}
              onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" /> Address
            </label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="Enter your home address"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Region / Locality</label>
            <input
              type="text"
              value={profile.region}
              onChange={(e) => setProfile({ ...profile, region: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="e.g., Mumbai, Maharashtra"
            />
            <p className="text-xs text-slate-400 mt-1">Used for neighborhood comparisons</p>
          </div>
        </div>
      </div>
    </div >
  );
};

// Tariff & Billing Section
const TariffSection = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    tariffPlan: { type: 'flat', flatRate: 5.5, currency: 'INR', peakHours: [], slabs: [] },
    billingCycleStartDay: 1,
    monthlyBudget: 3000
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.getTariffSettings();
      setSettings(data);
    } catch (error) {
      toast.error('Failed to load tariff settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateTariffSettings(settings);
      toast.success('Tariff settings updated');
    } catch (error) {
      toast.error('Failed to save tariff settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SettingsLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tariff & Billing</h2>
          <p className="text-slate-500 dark:text-slate-400">Configure your electricity tariff and billing preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 space-y-6">
        {/* Tariff Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Tariff Type</label>
          <div className="grid grid-cols-3 gap-3">
            {['flat', 'peak', 'slab'].map(type => (
              <button
                key={type}
                onClick={() => setSettings({
                  ...settings,
                  tariffPlan: { ...settings.tariffPlan, type }
                })}
                className={`p-4 rounded-xl border-2 transition-all ${settings.tariffPlan.type === type
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
              >
                <div className="font-medium text-slate-800 dark:text-white capitalize">{type}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {type === 'flat' && 'Same rate all day'}
                  {type === 'peak' && 'Higher during peak hours'}
                  {type === 'slab' && 'Rate varies by usage'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Flat Rate */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Zap className="w-4 h-4 inline mr-1" /> Rate per kWh
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">₹</span>
              <input
                type="number"
                step="0.1"
                value={settings.tariffPlan.flatRate}
                onChange={(e) => setSettings({
                  ...settings,
                  tariffPlan: { ...settings.tariffPlan, flatRate: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Billing Cycle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" /> Billing Cycle Start Day
            </label>
            <select
              value={settings.billingCycleStartDay}
              onChange={(e) => setSettings({ ...settings, billingCycleStartDay: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>Day {day}</option>
              ))}
            </select>
          </div>

          {/* Monthly Budget */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" /> Monthly Budget
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-slate-500">₹</span>
                <input
                  type="number"
                  value={settings.monthlyBudget}
                  onChange={(e) => setSettings({ ...settings, monthlyBudget: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <span className="text-slate-500">per month</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Used for budget alerts and goal tracking</p>
          </div>
        </div>

        {/* Peak Hours (if peak tariff) */}
        {settings.tariffPlan.type === 'peak' && (
          <div className="border-t pt-6">
            <h3 className="font-medium text-slate-800 mb-3">Peak Hours</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-500">Start Time</label>
                <input
                  type="time"
                  defaultValue="18:00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">End Time</label>
                <input
                  type="time"
                  defaultValue="22:00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Rate Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue="1.5"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Rooms & Zones Section
const RoomsSection = () => {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', floor: 'Ground', zone: 'living' });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await settingsService.getRooms();
      setRooms(data.rooms || []);
    } catch (error) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom.name.trim()) {
      toast.error('Room name is required');
      return;
    }
    try {
      const result = await settingsService.addRoom(newRoom);
      setRooms([...rooms, result.room]);
      setShowAddModal(false);
      setNewRoom({ name: '', floor: 'Ground', zone: 'living' });
      toast.success('Room added');
    } catch (error) {
      toast.error('Failed to add room');
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!confirm('Delete this room?')) return;
    try {
      await settingsService.deleteRoom(id);
      setRooms(rooms.filter(r => r.id !== id));
      toast.success('Room deleted');
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  if (loading) return <SettingsLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Rooms & Zones</h2>
          <p className="text-slate-500 dark:text-slate-400">Organize your devices by room and zone</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center">
          <LayoutGrid className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">No rooms configured</h3>
          <p className="text-slate-400 mb-4">Add rooms to organize your devices</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Your First Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => {
            const zoneInfo = ZONES.find(z => z.value === room.zone) || ZONES[4];
            return (
              <motion.div
                key={room.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">{room.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{room.floor} Floor</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${zoneInfo.color}`}>
                    {zoneInfo.label}
                  </span>
                  <span className="text-sm text-slate-500">{room.deviceCount || 0} devices</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Room Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Add New Room</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Room Name</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="e.g., Living Room"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Floor</label>
                  <select
                    value={newRoom.floor}
                    onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Basement">Basement</option>
                    <option value="Ground">Ground</option>
                    <option value="First">First</option>
                    <option value="Second">Second</option>
                    <option value="Third">Third</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Zone</label>
                  <select
                    value={newRoom.zone}
                    onChange={(e) => setNewRoom({ ...newRoom, zone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    {ZONES.map(zone => (
                      <option key={zone.value} value={zone.value}>{zone.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRoom}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add Room
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Members Section
const MembersSection = () => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'member' });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await settingsService.getMembers();
      setMembers(data.members || []);
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    try {
      await settingsService.inviteMember(inviteData);
      loadMembers();
      setShowInviteModal(false);
      setInviteData({ email: '', role: 'member' });
      toast.success('Member invited');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to invite member');
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this member?')) return;
    try {
      await settingsService.removeMember(id);
      setMembers(members.filter(m => m.id !== id));
      toast.success('Member removed');
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  if (loading) return <SettingsLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Members & Permissions</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage who can access your home</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg divide-y dark:divide-slate-700">
        {members.map(member => (
          <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium">
                {member.name?.charAt(0) || member.email?.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-slate-800 dark:text-white">{member.name || member.email}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{member.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${member.role === 'owner' ? 'bg-yellow-100 text-yellow-700' :
                member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                  member.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                }`}>
                {member.status === 'pending' ? 'Pending' : member.role}
              </span>
              {!member.isOwner && (
                <button
                  onClick={() => handleRemove(member.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {member.isOwner && <Crown className="w-5 h-5 text-yellow-500" />}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Invite Member</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="member@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role</label>
                  <div className="space-y-2">
                    {ROLES.map(role => (
                      <label
                        key={role.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${inviteData.role === role.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                          }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={inviteData.role === role.value}
                          onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                          className="hidden"
                        />
                        <role.icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-800 dark:text-white">{role.label}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{role.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Send Invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Notifications Section
const NotificationsSection = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    categories: {
      budgetAlerts: true,
      deviceOverload: true,
      automationActions: true,
      safetyOverrides: true,
      weeklyReports: true,
      tips: false
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    }
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await settingsService.getNotifications();
      setNotifications(data.notifications);
    } catch (error) {
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateNotifications(notifications);
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SettingsLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Notifications</h2>
          <p className="text-slate-500 dark:text-slate-400">Control how you receive alerts</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 space-y-6">
        {/* Channels */}
        <div>
          <h3 className="font-medium text-slate-800 dark:text-white mb-4">Notification Channels</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">Email Notifications</span>
              </div>
              <Toggle
                enabled={notifications.email}
                onChange={(val) => setNotifications({ ...notifications, email: val })}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">Push Notifications</span>
              </div>
              <Toggle
                enabled={notifications.push}
                onChange={async (val) => {
                  if (val) {
                    try {
                      const permission = await Notification.requestPermission();
                      if (permission === 'granted') {

                        // Register service worker if not already
                        if ('serviceWorker' in navigator) {
                          /* Note: In a real app, this should probably be in main.jsx */
                          /* But triggering it here ensures we have one for push */
                        }

                        // Get VAPID key
                        const publicKey = await settingsService.getVapidKey();

                        // Subscribe
                        const registration = await navigator.serviceWorker.ready;

                        // URL Base64 to Uint8Array conversion
                        const urlBase64ToUint8Array = (base64String) => {
                          const padding = '='.repeat((4 - base64String.length % 4) % 4);
                          const base64 = (base64String + padding)
                            .replace(/\-/g, '+')
                            .replace(/_/g, '/');

                          const rawData = window.atob(base64);
                          const outputArray = new Uint8Array(rawData.length);

                          for (let i = 0; i < rawData.length; ++i) {
                            outputArray[i] = rawData.charCodeAt(i);
                          }
                          return outputArray;
                        };

                        const convertedVapidKey = urlBase64ToUint8Array(publicKey);

                        const subscription = await registration.pushManager.subscribe({
                          userVisibleOnly: true,
                          applicationServerKey: convertedVapidKey
                        });

                        await settingsService.subscribeToPush(subscription);
                        toast.success('Push notifications enabled');
                        setNotifications({ ...notifications, push: true });
                      } else {
                        toast.error('Permission denied');
                        setNotifications({ ...notifications, push: false });
                      }
                    } catch (error) {
                      console.error('Push error:', error);
                      toast.error('Failed to enable push notifications');
                      setNotifications({ ...notifications, push: false });
                    }
                  } else {
                    setNotifications({ ...notifications, push: false });
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">SMS Notifications</span>
              </div>
              <Toggle
                enabled={notifications.sms}
                onChange={(val) => setNotifications({ ...notifications, sms: val })}
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <h3 className="font-medium text-slate-800 dark:text-white mb-4">Alert Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'budgetAlerts', label: 'Budget Alerts', desc: 'When spending exceeds budget' },
              { key: 'deviceOverload', label: 'Device Overload', desc: 'High power consumption warnings' },
              { key: 'automationActions', label: 'Automation Actions', desc: 'When rules are triggered' },
              { key: 'safetyOverrides', label: 'Safety Overrides', desc: 'Critical safety actions' },
              { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Usage summary emails' },
              { key: 'tips', label: 'Energy Tips', desc: 'Recommendations to save energy' }
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                </div>
                <Toggle
                  enabled={notifications.categories?.[item.key] ?? true}
                  onChange={(val) => setNotifications({
                    ...notifications,
                    categories: { ...notifications.categories, [item.key]: val }
                  })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-slate-800 dark:text-white">Quiet Hours</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pause non-critical notifications</p>
            </div>
            <Toggle
              enabled={notifications.quietHours?.enabled ?? false}
              onChange={(val) => setNotifications({
                ...notifications,
                quietHours: { ...notifications.quietHours, enabled: val }
              })}
            />
          </div>
          {notifications.quietHours?.enabled && (
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <Moon className="w-5 h-5 text-indigo-500" />
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={notifications.quietHours.start}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    quietHours: { ...notifications.quietHours, start: e.target.value }
                  })}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <span className="text-slate-500 dark:text-slate-400">to</span>
                <input
                  type="time"
                  value={notifications.quietHours.end}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    quietHours: { ...notifications.quietHours, end: e.target.value }
                  })}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Integrations Section (Placeholder)
const IntegrationsSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">Integrations</h2>
      <p className="text-slate-500 dark:text-slate-400">Connect with external services</p>
    </div>

    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center">
      <Plug className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">Coming Soon</h3>
      <p className="text-slate-400 mb-4 max-w-md mx-auto">
        Integration with voice assistants, solar panels, and energy credit systems will be available in a future update.
      </p>
    </div>
  </div>
);

// Loading Skeleton
const SettingsLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 space-y-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
      <div className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48" />
      <div className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded" />
    </div>
  </div>
);

// Main Settings Component
const Settings = () => {
  const [activeSection, setActiveSection] = useState('home');

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return <HomeProfileSection />;
      case 'tariff':
        return <TariffSection />;
      case 'rooms':
        return <RoomsSection />;
      case 'members':
        return <MembersSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'integrations':
        return <IntegrationsSection />;
      default:
        return <HomeProfileSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your home configuration and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SettingsSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
