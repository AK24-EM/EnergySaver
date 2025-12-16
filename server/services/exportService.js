import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';
import UsageLog from '../models/UsageLog.js';
import Device from '../models/Device.js';
import Goal from '../models/Goal.js';
import AutomationLog from '../models/AutomationLog.js';
import Home from '../models/Home.js';

/**
 * Export Service - Generates PDF and XLSX reports
 */

// Get date range based on period
const getDateRange = (period, startDate, endDate) => {
    const now = new Date();
    let start, end = now;

    if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
    } else {
        switch (period) {
            case 'daily':
                start = new Date(now);
                start.setHours(0, 0, 0, 0);
                break;
            case 'weekly':
                start = new Date(now);
                start.setDate(start.getDate() - 7);
                break;
            case 'monthly':
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }
    }

    return { start, end };
};

// Fetch all report data for export
export const fetchExportData = async (homeId, period, startDate, endDate) => {
    const { start, end } = getDateRange(period, startDate, endDate);

    // Get home details
    const home = await Home.findById(homeId);
    const tariffRate = home?.tariffPlan?.flatRate || home?.settings?.tariffRate || 5.5;

    // Get all devices for this home
    const devices = await Device.find({ home: homeId });
    const deviceIds = devices.map(d => d._id);

    // Get usage logs in the period
    const usageLogs = await UsageLog.find({
        device: { $in: deviceIds },
        timestamp: { $gte: start, $lte: end }
    }).populate('device', 'name category');

    // Calculate device stats
    const deviceStats = devices.map(device => {
        const logs = usageLogs.filter(log => log.device?._id?.toString() === device._id.toString());
        const totalWh = logs.reduce((sum, log) => sum + (log.power || 0), 0);
        const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
        return {
            name: device.name,
            category: device.category,
            totalKwh: totalWh / 1000,
            totalCost,
            usageHours: logs.length * 0.5 / 60, // Assuming 30-second intervals
            status: device.status
        };
    });

    // Calculate hourly breakdown
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
        const hourLogs = usageLogs.filter(log => new Date(log.timestamp).getHours() === hour);
        return {
            hour,
            power: hourLogs.reduce((sum, log) => sum + (log.power || 0), 0),
            cost: hourLogs.reduce((sum, log) => sum + (log.cost || 0), 0)
        };
    });

    // Calculate daily breakdown
    const dailyMap = {};
    usageLogs.forEach(log => {
        const date = new Date(log.timestamp).toISOString().split('T')[0];
        if (!dailyMap[date]) {
            dailyMap[date] = { date, power: 0, cost: 0, count: 0 };
        }
        dailyMap[date].power += log.power || 0;
        dailyMap[date].cost += log.cost || 0;
        dailyMap[date].count += 1;
    });
    const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Get goals
    const goals = await Goal.find({ home: homeId });

    // Get automation logs
    const automationLogs = await AutomationLog.find({
        home: homeId,
        timestamp: { $gte: start, $lte: end }
    }).sort({ timestamp: -1 }).limit(50);

    // Calculate totals
    const totalPower = usageLogs.reduce((sum, log) => sum + (log.power || 0), 0);
    const totalCost = usageLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const totalKwh = totalPower / 1000;

    // Find peak hour
    const peakHour = hourlyData.reduce((max, h) => h.power > max.power ? h : max, hourlyData[0]);

    // Carbon calculation (0.82 kg CO2 per kWh average)
    const carbonKg = totalKwh * 0.82;
    const treesEquivalent = Math.round(carbonKg / 21); // 21 kg CO2 per tree per year

    return {
        home: {
            name: home?.name || 'My Home',
            address: home?.address || '',
            budget: home?.monthlyBudget || home?.settings?.budget?.monthly || 3000
        },
        period: {
            type: period,
            start,
            end
        },
        summary: {
            totalKwh: Math.round(totalKwh * 100) / 100,
            totalCost: Math.round(totalCost * 100) / 100,
            avgDailyCost: dailyData.length > 0 ? Math.round((totalCost / dailyData.length) * 100) / 100 : 0,
            avgDailyKwh: dailyData.length > 0 ? Math.round((totalKwh / dailyData.length) * 100) / 100 : 0,
            peakHour: peakHour?.hour || 0,
            peakHourCost: Math.round((peakHour?.cost || 0) * 100) / 100,
            deviceCount: devices.length,
            daysInPeriod: dailyData.length || 1
        },
        devices: deviceStats,
        hourlyData,
        dailyData,
        goals: goals.map(g => ({
            type: g.type,
            period: g.period,
            target: g.target?.value,
            current: g.current?.value,
            percentage: g.current?.percentage,
            status: g.status
        })),
        automation: automationLogs.map(log => ({
            action: log.action,
            mode: log.mode,
            timestamp: log.timestamp,
            status: log.status
        })),
        carbon: {
            kgCO2: Math.round(carbonKg * 100) / 100,
            treesEquivalent
        },
        costBreakdown: {
            byDevice: deviceStats.map(d => ({ name: d.name, cost: d.totalCost })),
            byCategory: Object.entries(
                deviceStats.reduce((acc, d) => {
                    acc[d.category] = (acc[d.category] || 0) + d.totalCost;
                    return acc;
                }, {})
            ).map(([category, cost]) => ({ category, cost }))
        }
    };
};

// Generate PDF Report - Professional Design
export const generatePDF = async (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 40,
                size: 'A4',
                bufferPages: true
            });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const { home, period, summary, devices, hourlyData, goals, carbon, costBreakdown } = data;

            // Design constants
            const colors = {
                primary: '#4F46E5',
                primaryLight: '#818CF8',
                secondary: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444',
                dark: '#1E293B',
                gray: '#64748B',
                lightGray: '#F1F5F9',
                white: '#FFFFFF'
            };

            const pageWidth = 515;
            const leftMargin = 40;

            // Helper function to draw a colored box
            const drawBox = (x, y, width, height, color, radius = 8) => {
                doc.roundedRect(x, y, width, height, radius).fill(color);
            };

            // Helper to draw section header
            const drawSectionHeader = (title, emoji, yPos) => {
                doc.roundedRect(leftMargin, yPos, pageWidth, 32, 6)
                    .fill(colors.lightGray);
                doc.fontSize(14)
                    .fillColor(colors.primary)
                    .text(`${emoji}  ${title}`, leftMargin + 12, yPos + 9);
                return yPos + 45;
            };

            // ========================================
            // PAGE 1 - HEADER & EXECUTIVE SUMMARY
            // ========================================

            // Header Banner
            drawBox(0, 0, 595, 120, colors.primary, 0);

            // Logo area
            doc.fontSize(28)
                .fillColor(colors.white)
                .text('⚡', leftMargin, 25, { continued: true })
                .font('Helvetica-Bold')
                .text(' EnergySaver', leftMargin + 5, 25);

            doc.fontSize(12)
                .font('Helvetica')
                .fillColor(colors.primaryLight)
                .text('Smart Energy Management Report', leftMargin, 58);

            // Home name and period on right
            doc.fontSize(16)
                .fillColor(colors.white)
                .text(home.name, 350, 30, { width: 200, align: 'right' });

            const periodLabel = period.type === 'daily' ? 'Today' :
                period.type === 'weekly' ? 'This Week' : 'This Month';
            doc.fontSize(10)
                .fillColor(colors.primaryLight)
                .text(`📅 ${periodLabel}`, 350, 52, { width: 200, align: 'right' })
                .text(`${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`, 350, 66, { width: 200, align: 'right' });

            // Generation date
            doc.fontSize(9)
                .text(`Generated: ${new Date().toLocaleString()}`, 350, 95, { width: 200, align: 'right' });

            let yPos = 140;

            // EXECUTIVE SUMMARY SECTION
            yPos = drawSectionHeader('Executive Summary', '📊', yPos);

            // Summary cards row
            const cardWidth = (pageWidth - 30) / 4;
            const cards = [
                { label: 'Total Energy', value: `${summary.totalKwh}`, unit: 'kWh', color: colors.primary },
                { label: 'Total Cost', value: `₹${summary.totalCost}`, unit: '', color: colors.secondary },
                { label: 'Avg Daily', value: `₹${summary.avgDailyCost}`, unit: '/day', color: colors.warning },
                { label: 'Peak Hour', value: `${summary.peakHour}:00`, unit: '', color: colors.danger }
            ];

            cards.forEach((card, i) => {
                const x = leftMargin + (i * (cardWidth + 10));
                drawBox(x, yPos, cardWidth, 65, colors.lightGray);
                drawBox(x, yPos, 4, 65, card.color, 0);

                doc.fontSize(9)
                    .fillColor(colors.gray)
                    .text(card.label, x + 12, yPos + 10);

                doc.fontSize(16)
                    .font('Helvetica-Bold')
                    .fillColor(colors.dark)
                    .text(card.value, x + 12, yPos + 28);

                if (card.unit) {
                    doc.fontSize(9)
                        .font('Helvetica')
                        .fillColor(colors.gray)
                        .text(card.unit, x + 12, yPos + 48);
                }
            });

            doc.font('Helvetica');
            yPos += 85;

            // Budget Status
            const budgetUsed = home.budget > 0 ? (summary.totalCost / home.budget) * 100 : 0;
            const budgetStatus = budgetUsed > 100 ? 'Over Budget' : budgetUsed > 80 ? 'Near Limit' : 'On Track';
            const budgetColor = budgetUsed > 100 ? colors.danger : budgetUsed > 80 ? colors.warning : colors.secondary;

            drawBox(leftMargin, yPos, pageWidth, 50, colors.lightGray);
            doc.fontSize(10)
                .fillColor(colors.gray)
                .text('Monthly Budget Status', leftMargin + 15, yPos + 10);

            // Progress bar background
            doc.roundedRect(leftMargin + 15, yPos + 28, pageWidth - 130, 12, 6).fill('#E2E8F0');
            // Progress bar fill
            const progressWidth = Math.min(budgetUsed, 100) / 100 * (pageWidth - 130);
            doc.roundedRect(leftMargin + 15, yPos + 28, progressWidth, 12, 6).fill(budgetColor);

            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor(budgetColor)
                .text(`${budgetStatus} - ${budgetUsed.toFixed(1)}%`, pageWidth - 80, yPos + 18, { width: 100, align: 'right' });
            doc.font('Helvetica');

            yPos += 70;

            // ========================================
            // DEVICE BREAKDOWN SECTION
            // ========================================
            yPos = drawSectionHeader('Device Breakdown', '🔌', yPos);

            // Table header
            drawBox(leftMargin, yPos, pageWidth, 28, colors.primary);
            doc.fontSize(9)
                .fillColor(colors.white)
                .text('Device', leftMargin + 15, yPos + 9, { width: 150 })
                .text('Category', leftMargin + 170, yPos + 9, { width: 100 })
                .text('Usage (kWh)', leftMargin + 280, yPos + 9, { width: 80 })
                .text('Cost (₹)', leftMargin + 370, yPos + 9, { width: 70 })
                .text('% of Total', leftMargin + 445, yPos + 9, { width: 60 });

            yPos += 28;

            // Table rows
            devices.slice(0, 8).forEach((device, i) => {
                const rowColor = i % 2 === 0 ? colors.white : colors.lightGray;
                const percentage = summary.totalCost > 0 ? ((device.totalCost / summary.totalCost) * 100).toFixed(1) : 0;

                drawBox(leftMargin, yPos, pageWidth, 26, rowColor, 0);

                doc.fontSize(9)
                    .fillColor(colors.dark)
                    .text(device.name, leftMargin + 15, yPos + 8, { width: 150 })
                    .fillColor(colors.gray)
                    .text(device.category, leftMargin + 170, yPos + 8, { width: 100 })
                    .fillColor(colors.dark)
                    .text(device.totalKwh.toFixed(2), leftMargin + 280, yPos + 8, { width: 80 })
                    .text(`₹${device.totalCost.toFixed(2)}`, leftMargin + 370, yPos + 8, { width: 70 })
                    .fillColor(colors.primary)
                    .text(`${percentage}%`, leftMargin + 445, yPos + 8, { width: 60 });

                yPos += 26;
            });

            yPos += 20;

            // ========================================
            // PEAK HOURS ANALYSIS
            // ========================================
            if (yPos > 650) {
                doc.addPage();
                yPos = 40;
            }

            yPos = drawSectionHeader('Peak Hours Analysis', '⏰', yPos);

            // Find top 6 expensive hours
            const maxCost = Math.max(...hourlyData.map(h => h.cost));
            const topHours = [...hourlyData].sort((a, b) => b.cost - a.cost).slice(0, 6);

            topHours.forEach((h, i) => {
                const barWidth = maxCost > 0 ? (h.cost / maxCost) * 280 : 0;
                const isPeak = h.hour >= 18 && h.hour <= 22;

                doc.fontSize(10)
                    .fillColor(colors.dark)
                    .text(`${String(h.hour).padStart(2, '0')}:00`, leftMargin, yPos + 2);

                // Bar background
                doc.roundedRect(leftMargin + 50, yPos, 280, 18, 4).fill('#E2E8F0');
                // Bar fill
                doc.roundedRect(leftMargin + 50, yPos, barWidth, 18, 4)
                    .fill(isPeak ? colors.danger : colors.primary);

                // Peak label
                if (isPeak) {
                    doc.fontSize(7)
                        .fillColor(colors.white)
                        .text('PEAK', leftMargin + 55, yPos + 5);
                }

                doc.fontSize(10)
                    .fillColor(colors.dark)
                    .text(`₹${h.cost.toFixed(2)}`, leftMargin + 340, yPos + 2)
                    .fillColor(colors.gray)
                    .text(`${(h.power / 1000).toFixed(2)} kWh`, leftMargin + 420, yPos + 2);

                yPos += 25;
            });

            yPos += 15;

            // ========================================
            // CARBON IMPACT & GOALS
            // ========================================
            if (yPos > 550) {
                doc.addPage();
                yPos = 40;
            }

            // Two column layout
            const colWidth = (pageWidth - 20) / 2;

            // Carbon Impact (left column)
            drawBox(leftMargin, yPos, colWidth, 120, colors.lightGray);
            doc.fontSize(12)
                .fillColor(colors.secondary)
                .text('🌱 Carbon Impact', leftMargin + 15, yPos + 12);

            doc.fontSize(28)
                .font('Helvetica-Bold')
                .fillColor(colors.dark)
                .text(`${carbon.kgCO2}`, leftMargin + 15, yPos + 38);
            doc.fontSize(12)
                .font('Helvetica')
                .fillColor(colors.gray)
                .text('kg CO₂ emitted', leftMargin + 15, yPos + 70);

            doc.fontSize(11)
                .fillColor(colors.secondary)
                .text(`🌳 ${carbon.treesEquivalent} trees needed to offset`, leftMargin + 15, yPos + 92);

            // Goal Progress (right column)
            drawBox(leftMargin + colWidth + 20, yPos, colWidth, 120, colors.lightGray);
            doc.fontSize(12)
                .fillColor(colors.primary)
                .text('🎯 Goal Progress', leftMargin + colWidth + 35, yPos + 12);

            if (goals.length > 0) {
                const goal = goals[0];
                const goalColor = goal.status === 'completed' ? colors.secondary :
                    goal.status === 'exceeded' ? colors.danger : colors.warning;

                doc.fontSize(28)
                    .font('Helvetica-Bold')
                    .fillColor(goalColor)
                    .text(`${goal.percentage || 0}%`, leftMargin + colWidth + 35, yPos + 38);
                doc.fontSize(12)
                    .font('Helvetica')
                    .fillColor(colors.gray)
                    .text(`${goal.type} (${goal.period})`, leftMargin + colWidth + 35, yPos + 70);

                const statusEmoji = goal.status === 'completed' ? '✅' : goal.status === 'exceeded' ? '⚠️' : '🔄';
                doc.fontSize(11)
                    .fillColor(goalColor)
                    .text(`${statusEmoji} ${goal.status}`, leftMargin + colWidth + 35, yPos + 92);
            } else {
                doc.fontSize(11)
                    .fillColor(colors.gray)
                    .text('No goals set', leftMargin + colWidth + 35, yPos + 55);
            }

            yPos += 140;

            // ========================================
            // COST BY CATEGORY
            // ========================================
            if (yPos > 600) {
                doc.addPage();
                yPos = 40;
            }

            yPos = drawSectionHeader('Cost by Category', '💰', yPos);

            const categories = costBreakdown.byCategory || [];
            const catWidth = pageWidth / Math.max(categories.length, 1);

            categories.forEach((cat, i) => {
                const x = leftMargin + (i * catWidth);
                const percentage = summary.totalCost > 0 ? (cat.cost / summary.totalCost) * 100 : 0;

                drawBox(x + 5, yPos, catWidth - 10, 70, colors.lightGray);

                doc.fontSize(10)
                    .fillColor(colors.gray)
                    .text(cat.category, x + 15, yPos + 10, { width: catWidth - 30 });

                doc.fontSize(18)
                    .font('Helvetica-Bold')
                    .fillColor(colors.dark)
                    .text(`₹${cat.cost.toFixed(0)}`, x + 15, yPos + 28);

                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor(colors.primary)
                    .text(`${percentage.toFixed(1)}%`, x + 15, yPos + 52);
            });

            yPos += 90;

            // ========================================
            // RECOMMENDATIONS
            // ========================================
            if (yPos > 600) {
                doc.addPage();
                yPos = 40;
            }

            yPos = drawSectionHeader('Recommendations', '💡', yPos);

            const recommendations = [];

            if (budgetUsed > 80) {
                recommendations.push('Consider reducing usage during peak hours (6 PM - 10 PM) to stay within budget.');
            }

            const highUsageDevices = devices.filter(d =>
                summary.totalCost > 0 && (d.totalCost / summary.totalCost) > 0.3
            );
            if (highUsageDevices.length > 0) {
                recommendations.push(`${highUsageDevices[0].name} accounts for over 30% of your costs. Consider optimizing its usage.`);
            }

            if (summary.peakHour >= 18 && summary.peakHour <= 22) {
                recommendations.push('Your peak usage is during expensive hours. Shift high-power activities to off-peak times.');
            }

            if (carbon.kgCO2 > 50) {
                recommendations.push('Your carbon footprint is significant. Enable eco-mode automations to reduce environmental impact.');
            }

            if (recommendations.length === 0) {
                recommendations.push('Great job! Your energy usage is well optimized. Keep up the good habits!');
            }

            recommendations.slice(0, 4).forEach((rec, i) => {
                drawBox(leftMargin, yPos, pageWidth, 35, i % 2 === 0 ? colors.lightGray : colors.white);
                doc.fontSize(10)
                    .fillColor(colors.secondary)
                    .text(`${i + 1}.`, leftMargin + 10, yPos + 12);
                doc.fillColor(colors.dark)
                    .text(rec, leftMargin + 30, yPos + 12, { width: pageWidth - 50 });
                yPos += 38;
            });

            // ========================================
            // FOOTER
            // ========================================
            const footerY = 800;
            doc.fontSize(8)
                .fillColor(colors.gray)
                .text('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', leftMargin, footerY - 15)
                .text('EnergySaver - Smart Energy Management', leftMargin, footerY, { continued: true })
                .text(`  |  Generated on ${new Date().toLocaleDateString()}`, { continued: true })
                .text(`  |  ${home.name}`, { align: 'right' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

// Generate XLSX Workbook
export const generateXLSX = async (data) => {
    const { home, period, summary, devices, hourlyData, dailyData, goals, automation, costBreakdown, carbon } = data;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summarySheet = XLSX.utils.aoa_to_sheet([
        ['EnergySaver Report - ' + home.name],
        ['Period', `${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`],
        [''],
        ['Metric', 'Value'],
        ['Total Energy (kWh)', summary.totalKwh],
        ['Total Cost (₹)', summary.totalCost],
        ['Avg Daily Cost (₹)', summary.avgDailyCost],
        ['Avg Daily Usage (kWh)', summary.avgDailyKwh],
        ['Devices Tracked', summary.deviceCount],
        ['Days in Period', summary.daysInPeriod],
        ['Peak Hour', `${summary.peakHour}:00`],
        ['Peak Hour Cost (₹)', summary.peakHourCost],
        ['Carbon Footprint (kg CO₂)', carbon.kgCO2],
        ['Trees to Offset', carbon.treesEquivalent],
        ['Monthly Budget (₹)', home.budget]
    ]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Sheet 2: Devices
    const deviceHeaders = ['Device Name', 'Category', 'Usage (kWh)', 'Cost (₹)', 'Status'];
    const deviceRows = devices.map(d => [d.name, d.category, d.totalKwh, d.totalCost, d.status]);
    const deviceSheet = XLSX.utils.aoa_to_sheet([deviceHeaders, ...deviceRows]);
    XLSX.utils.book_append_sheet(workbook, deviceSheet, 'Devices');

    // Sheet 3: Hourly Usage
    const hourlyHeaders = ['Hour', 'Power (Wh)', 'Cost (₹)'];
    const hourlyRows = hourlyData.map(h => [`${String(h.hour).padStart(2, '0')}:00`, h.power, h.cost]);
    const hourlySheet = XLSX.utils.aoa_to_sheet([hourlyHeaders, ...hourlyRows]);
    XLSX.utils.book_append_sheet(workbook, hourlySheet, 'Hourly Usage');

    // Sheet 4: Daily Usage
    const dailyHeaders = ['Date', 'Power (Wh)', 'Cost (₹)', 'Log Count'];
    const dailyRows = dailyData.map(d => [d.date, d.power, d.cost, d.count]);
    const dailySheet = XLSX.utils.aoa_to_sheet([dailyHeaders, ...dailyRows]);
    XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Usage');

    // Sheet 5: Cost Breakdown
    const costHeaders = ['Category', 'Cost (₹)'];
    const costRows = costBreakdown.byCategory.map(c => [c.category, c.cost]);
    const costSheet = XLSX.utils.aoa_to_sheet([costHeaders, ...costRows]);
    XLSX.utils.book_append_sheet(workbook, costSheet, 'Cost Breakdown');

    // Sheet 6: Goals
    if (goals.length > 0) {
        const goalHeaders = ['Type', 'Period', 'Target', 'Current', 'Percentage', 'Status'];
        const goalRows = goals.map(g => [g.type, g.period, g.target, g.current, g.percentage, g.status]);
        const goalSheet = XLSX.utils.aoa_to_sheet([goalHeaders, ...goalRows]);
        XLSX.utils.book_append_sheet(workbook, goalSheet, 'Goals');
    }

    // Sheet 7: Automation Log
    if (automation.length > 0) {
        const autoHeaders = ['Action', 'Mode', 'Timestamp', 'Status'];
        const autoRows = automation.map(a => [a.action, a.mode, new Date(a.timestamp).toLocaleString(), a.status]);
        const autoSheet = XLSX.utils.aoa_to_sheet([autoHeaders, ...autoRows]);
        XLSX.utils.book_append_sheet(workbook, autoSheet, 'Automation Log');
    }

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
};

export default {
    fetchExportData,
    generatePDF,
    generateXLSX
};
