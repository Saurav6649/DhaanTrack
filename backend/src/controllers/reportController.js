import * as reportService from '../services/reportService.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const { filterType, customStart, customEnd, profitMode, userId, machineId } = req.query;
    const stats = await reportService.getDashboardStats({
      filterType,
      customStart,
      customEnd,
      profitMode,
      userId,
      machineId,
    });
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getReport = async (req, res, next) => {
  try {
    const { reportType } = req.params;
    const reportData = await reportService.getReportData(reportType, req.query);
    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

export const exportExcel = async (req, res, next) => {
  try {
    const { reportType } = req.params;
    const buffer = await reportService.exportReportToExcel(reportType, req.query);

    const filename = `DhaanTrack_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
