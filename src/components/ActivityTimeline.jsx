import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Settings, UserPlus, Power, Activity } from 'lucide-react';
import api from '../services/api';

const ActivityTimeline = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/activity?limit=5');
            setLogs(response.logs);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
            setLoading(false);
        }
    };

    const getIcon = (action) => {
        switch (action) {
            case 'DEVICE_TOGGLE': return <Power className="w-4 h-4 text-blue-500" />;
            case 'DEVICE_ADD': return <Zap className="w-4 h-4 text-yellow-500" />;
            case 'MODE_ACTIVATE': return <Settings className="w-4 h-4 text-purple-500" />;
            case 'MEMBER_INVITE': return <UserPlus className="w-4 h-4 text-green-500" />;
            default: return <Activity className="w-4 h-4 text-slate-400" />;
        }
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        const now = new Date();
        const diff = (now - date) / 1000; // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return <div className="h-40 animate-pulse bg-slate-50 rounded-xl"></div>;
    }

    if (logs.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-slate-400" />
                    Recent Activity
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">No activity recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-slate-400" />
                Recent Activity
            </h3>
            <div className="space-y-4">
                {logs.map((log, index) => (
                    <motion.div
                        key={log._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-3"
                    >
                        <div className="mt-1 p-1.5 bg-slate-50 dark:bg-slate-700 rounded-full border border-slate-100 dark:border-slate-600 flex-shrink-0">
                            {getIcon(log.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {log.details}
                            </p>
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{log.user?.name || 'System'}</span>
                                <span className="mx-1">•</span>
                                <span>{formatTime(log.timestamp)}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ActivityTimeline;
