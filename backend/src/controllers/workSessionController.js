import * as workSessionService from '../services/workSessionService.js';
import {
  kathaToAcre,
  calculateEstimatedHours,
  calculateExpectedAmount,
  calculateTimeDifference,
  calculateAmountByMinutes,
  formatHoursAndMinutes,
} from '../utils/calculator.js';
import { MasterData } from '../models/MasterData.js';
import { DEFAULT_CONFIG } from '../config/constants.js';

export const createWorkSession = async (req, res, next) => {
  try {
    const session = await workSessionService.createWorkSession(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Work session created successfully.',
      data: { workSession: session },
    });
  } catch (error) {
    next(error);
  }
};

export const startWork = async (req, res, next) => {
  try {
    const session = await workSessionService.startWork(req.params.id, req.user);
    res.json({
      success: true,
      message: 'Work session started.',
      data: { workSession: session },
    });
  } catch (error) {
    next(error);
  }
};

export const pauseWork = async (req, res, next) => {
  try {
    const session = await workSessionService.pauseWork(req.params.id, req.user);
    res.json({
      success: true,
      message: 'Work session paused.',
      data: { workSession: session },
    });
  } catch (error) {
    next(error);
  }
};

export const resumeWork = async (req, res, next) => {
  try {
    const session = await workSessionService.resumeWork(req.params.id, req.user);
    res.json({
      success: true,
      message: 'Work session resumed.',
      data: { workSession: session },
    });
  } catch (error) {
    next(error);
  }
};

export const completeWork = async (req, res, next) => {
  try {
    const session = await workSessionService.completeWork(req.params.id, req.user);
    res.json({
      success: true,
      message: 'Work session completed successfully.',
      data: { workSession: session },
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveSession = async (req, res, next) => {
  try {
    const session = await workSessionService.getActiveSession(req.user);
    res.json({
      success: true,
      data: { activeSession: session },
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkSessions = async (req, res, next) => {
  try {
    const sessions = await workSessionService.getWorkSessions(req.query, req.user);
    res.json({
      success: true,
      data: { workSessions: sessions },
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkSessionById = async (req, res, next) => {
  try {
    const session = await workSessionService.getWorkSessionById(req.params.id, req.user);
    res.json({
      success: true,
      data: { workSession: session },
    });
  } catch (error) {
    next(error);
  }
};

// Calculations / Previews
export const quickMinutesCalc = async (req, res, next) => {
  try {
    const { totalMinutes, hourlyRate } = req.body;
    const amount = calculateAmountByMinutes(totalMinutes, hourlyRate);
    res.json({
      success: true,
      data: {
        totalMinutes,
        hourlyRate,
        hours: Number((totalMinutes / 60).toFixed(2)),
        amount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const quickTimeCalc = async (req, res, next) => {
  try {
    const { startTime, endTime, hourlyRate } = req.body;
    const diff = calculateTimeDifference(startTime, endTime);
    const amount = calculateAmountByMinutes(diff.minutes, hourlyRate);
    res.json({
      success: true,
      data: {
        startTime,
        endTime,
        durationMinutes: diff.minutes,
        durationHours: diff.hours,
        formattedDuration: diff.formatted,
        amount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const fieldEstimateCalc = async (req, res, next) => {
  try {
    const { katha, acre, kathaPerAcre, capacityPerHour, customerHourlyRate } = req.body;

    let kathaPerAcreFactor = kathaPerAcre;
    if (!kathaPerAcreFactor) {
      const config = await MasterData.findOne({ key: 'kathaPerAcre' });
      kathaPerAcreFactor = config?.value || DEFAULT_CONFIG.kathaPerAcre;
    }

    let calculatedAcre = Number(acre) || 0;
    if (!calculatedAcre && Number(katha) > 0) {
      calculatedAcre = kathaToAcre(Number(katha), kathaPerAcreFactor);
    }

    const capacity = Number(capacityPerHour) > 0 ? Number(capacityPerHour) : DEFAULT_CONFIG.machineCapacityPerHour;
    const totalMinutes = calculatedAcre > 0 ? Math.round((calculatedAcre / capacity) * 60) : 0;
    const estimatedHours = calculatedAcre > 0 ? calculateEstimatedHours(calculatedAcre, capacity) : 0;
    const expectedAmount = calculateExpectedAmount(estimatedHours, customerHourlyRate);
    const formattedDuration = formatHoursAndMinutes(totalMinutes);

    res.json({
      success: true,
      data: {
        katha: Number(katha) || 0,
        acre: calculatedAcre,
        totalMinutes,
        estimatedHours,
        formattedDuration,
        expectedAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkSession = async (req, res, next) => {
  try {
    const session = await workSessionService.deleteWorkSession(req.params.id, req.user);
    res.json({
      success: true,
      message: 'Work session moved to Recycle Bin successfully.',
      data: { workSession: session },
    });
  } catch (error) {
    next(error);
  }
};

export const requestDeletion = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const session = await workSessionService.requestWorkSessionDeletion(req.params.id, reason, req.user);
    res.json({
      success: true,
      message: 'Deletion request submitted for administrator review.',
      data: { workSession: session },
    });
  } catch (error) {
    next(error);
  }
};

export const reviewDeletion = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body;
    const session = await workSessionService.reviewDeletionRequest(req.params.id, { action, rejectionReason }, req.user);
    res.json({
      success: true,
      message: action === 'APPROVE' ? 'Work session deletion approved.' : 'Work session deletion rejected.',
      data: { workSession: session },
    });
  } catch (error) {
    next(error);
  }
};

export const getDeletionRequests = async (req, res, next) => {
  try {
    const sessions = await workSessionService.getDeletionRequests(req.query, req.user);
    res.json({
      success: true,
      data: { deletionRequests: sessions },
    });
  } catch (error) {
    next(error);
  }
};
