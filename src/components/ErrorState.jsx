import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({ title = 'Error', message, onRetry }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 text-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-3">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-1">{title}</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mb-4 max-w-xs">{message || 'Something went wrong while loading this content.'}</p>

            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium shadow-sm transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Try Again</span>
                </button>
            )}
        </div>
    );
};

export default ErrorState;
