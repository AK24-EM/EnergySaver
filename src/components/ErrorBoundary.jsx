import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null, errorInfo: null };

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
                        <p className="text-slate-500 mb-6">
                            We encountered an unexpected error. Our team has been notified.
                        </p>

                        <div className="bg-slate-100 rounded-lg p-4 mb-6 text-left overflow-auto max-h-32">
                            <p className="font-mono text-xs text-slate-600 break-all">
                                {this.state.error?.toString()}
                            </p>
                        </div>

                        <div className="flex flex-col space-y-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                            >
                                <RefreshCcw className="w-4 h-4 mr-2" />
                                Reload Page
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="w-full flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
