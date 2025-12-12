import express from 'express';
import { fetchExportData, generatePDF, generateXLSX } from '../services/exportService.js';

const router = express.Router();

// GET /export/pdf - Generate PDF Summary Report
router.get('/pdf', async (req, res) => {
    try {
        const { period = 'monthly', startDate, endDate } = req.query;
        const homeId = req.user.home?._id;

        if (!homeId) {
            return res.status(400).json({ message: 'No home associated with user' });
        }

        // Fetch all report data
        const data = await fetchExportData(homeId, period, startDate, endDate);

        // Generate PDF
        const pdfBuffer = await generatePDF(data);

        // Set headers for download
        const filename = `EnergySaver-Report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({ message: 'Failed to generate PDF report' });
    }
});

// GET /export/xlsx - Generate XLSX Data Pack
router.get('/xlsx', async (req, res) => {
    try {
        const { period = 'monthly', startDate, endDate } = req.query;
        const homeId = req.user.home?._id;

        if (!homeId) {
            return res.status(400).json({ message: 'No home associated with user' });
        }

        // Fetch all report data
        const data = await fetchExportData(homeId, period, startDate, endDate);

        // Generate XLSX
        const xlsxBuffer = await generateXLSX(data);

        // Set headers for download
        const filename = `EnergySaver-Data-${period}-${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', xlsxBuffer.length);

        res.send(xlsxBuffer);
    } catch (error) {
        console.error('XLSX export error:', error);
        res.status(500).json({ message: 'Failed to generate XLSX report' });
    }
});

// GET /export/info - Get export info (for preview)
router.get('/info', async (req, res) => {
    try {
        const { period = 'monthly', startDate, endDate } = req.query;
        const homeId = req.user.home?._id;

        if (!homeId) {
            return res.status(400).json({ message: 'No home associated with user' });
        }

        // Fetch data for info
        const data = await fetchExportData(homeId, period, startDate, endDate);

        res.json({
            homeName: data.home.name,
            period: {
                type: period,
                start: data.period.start,
                end: data.period.end
            },
            summary: data.summary,
            deviceCount: data.devices.length,
            dataPoints: data.dailyData.length
        });
    } catch (error) {
        console.error('Export info error:', error);
        res.status(500).json({ message: 'Failed to get export info' });
    }
});

export default router;
