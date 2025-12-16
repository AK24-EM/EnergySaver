import api from './api';

/**
 * Export Service - API calls for report exports
 * Uses key-value axios config to override responseType for blobs
 */

export const exportService = {
    // Get export info/preview
    getExportInfo: async (period = 'monthly') => {
        const response = await api.get(`/export/info?period=${period}`);
        return response;
    },

    // Download PDF report
    downloadPDF: async (period = 'monthly') => {
        // api instance already has baseURL and auth interceptors
        // We just need to override responseType for binary data
        const response = await api.get(`/export/pdf?period=${period}`, {
            responseType: 'blob',
            timeout: 60000 // 60 second timeout for large reports
        });

        // Create download link
        const blob = new Blob([response], { type: 'application/pdf' });
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
        const response = await api.get(`/export/xlsx?period=${period}`, {
            responseType: 'blob',
            timeout: 60000
        });

        // Create download link
        const blob = new Blob([response], {
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
