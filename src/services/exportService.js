import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Export Service - API calls for report exports
 * Uses axios directly for blob downloads to avoid interceptor issues
 */

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const exportService = {
    // Get export info/preview
    getExportInfo: async (period = 'monthly') => {
        const response = await axios.get(`${API_BASE_URL}/export/info?period=${period}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    // Download PDF report
    downloadPDF: async (period = 'monthly') => {
        const response = await axios.get(`${API_BASE_URL}/export/pdf?period=${period}`, {
            headers: getAuthHeaders(),
            responseType: 'blob',
            timeout: 60000 // 60 second timeout for large reports
        });

        // Create download link
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EnergySaver-Report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        // Cleanup after a short delay to ensure download starts
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);

        return true;
    },

    // Download XLSX data pack
    downloadXLSX: async (period = 'monthly') => {
        const response = await axios.get(`${API_BASE_URL}/export/xlsx?period=${period}`, {
            headers: getAuthHeaders(),
            responseType: 'blob',
            timeout: 60000
        });

        // Create download link
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EnergySaver-Data-${period}-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        // Cleanup after a short delay
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);

        return true;
    },

    // Download both formats
    downloadBoth: async (period = 'monthly') => {
        await exportService.downloadPDF(period);
        // Delay between downloads so both show in finder
        await new Promise(resolve => setTimeout(resolve, 1000));
        await exportService.downloadXLSX(period);
        return true;
    }
};

export default exportService;

