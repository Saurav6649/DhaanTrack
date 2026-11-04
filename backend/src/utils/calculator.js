import { DEFAULT_CONFIG } from '../config/constants.js';

/**
 * Convert Katha to Acre using local conversion factor
 * @param {number} katha
 * @param {number} kathaPerAcre
 * @returns {number}
 */
export const kathaToAcre = (katha, kathaPerAcre = DEFAULT_CONFIG.kathaPerAcre) => {
  if (!katha || katha <= 0) return 0;
  const factor = Number(kathaPerAcre) > 0 ? Number(kathaPerAcre) : DEFAULT_CONFIG.kathaPerAcre;
  return Number((Number(katha) / factor).toFixed(4));
};

/**
 * Estimate expected working time in hours
 * @param {number} acres
 * @param {number} capacityPerHour
 * @returns {number}
 */
export const calculateEstimatedHours = (acres, capacityPerHour = DEFAULT_CONFIG.machineCapacityPerHour) => {
  if (!acres || acres <= 0) return 0;
  const capacity = Number(capacityPerHour) > 0 ? Number(capacityPerHour) : 1;
  return Number((acres / capacity).toFixed(2));
};

/**
 * Calculate expected customer billing amount
 * @param {number} estimatedHours
 * @param {number} hourlyRate
 * @returns {number}
 */
export const calculateExpectedAmount = (estimatedHours, hourlyRate) => {
  if (!estimatedHours || estimatedHours <= 0 || !hourlyRate || hourlyRate <= 0) return 0;
  return Math.round(Number(estimatedHours) * Number(hourlyRate) * 100) / 100;
};

/**
 * Calculate duration between start and end time strings (HH:mm)
 * Handles crossing midnight cleanly.
 * e.g., '22:00' to '02:30' -> 4.5 hours (270 minutes)
 * @param {string} startTime 'HH:mm'
 * @param {string} endTime 'HH:mm'
 * @returns {{ minutes: number, hours: number, formatted: string }}
 */
export const calculateTimeDifference = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return { minutes: 0, hours: 0, formatted: '0h 0m' };
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  if (
    isNaN(startH) || isNaN(startM) ||
    isNaN(endH) || isNaN(endM) ||
    startH < 0 || startH > 23 || startM < 0 || startM > 59 ||
    endH < 0 || endH > 23 || endM < 0 || endM > 59
  ) {
    throw new Error('Invalid time format. Please provide valid HH:mm values.');
  }

  let startTotalMinutes = startH * 60 + startM;
  let endTotalMinutes = endH * 60 + endM;

  // Handle midnight crossing
  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60; // Add 24 hours
  }

  const diffMinutes = endTotalMinutes - startTotalMinutes;
  const hours = Number((diffMinutes / 60).toFixed(2));
  const hPart = Math.floor(diffMinutes / 60);
  const mPart = diffMinutes % 60;

  return {
    minutes: diffMinutes,
    hours,
    formatted: `${hPart}h ${mPart}m`,
  };
};

/**
 * Format minutes into clean hours and minutes string
 * E.g.: 15 mins -> "15 Minutes"
 *       30 mins -> "30 Minutes"
 *       60 mins -> "1 Hour"
 *       90 mins -> "1 Hour 30 Minutes"
 *       135 mins -> "2 Hours 15 Minutes"
 *       180 mins -> "3 Hours"
 * Avoids displaying '0 hrs' when duration is under 1 hour.
 * @param {number} totalMinutes
 * @returns {string}
 */
export const formatHoursAndMinutes = (totalMinutes = 0) => {
  const mins = Math.max(0, Math.round(Number(totalMinutes) || 0));
  if (mins === 0) return '0 Minutes';
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours === 0) {
    return `${remainingMins} Minute${remainingMins > 1 ? 's' : ''}`;
  }
  if (remainingMins === 0) {
    return `${hours} Hour${hours > 1 ? 's' : ''}`;
  }
  return `${hours} Hour${hours > 1 ? 's' : ''} ${remainingMins} Minute${remainingMins > 1 ? 's' : ''}`;
};

/**
 * Calculate billing amount for given minutes and hourly rate
 * @param {number} minutes
 * @param {number} hourlyRate
 * @returns {number}
 */
export const calculateAmountByMinutes = (minutes, hourlyRate) => {
  if (!minutes || minutes <= 0 || !hourlyRate || hourlyRate <= 0) return 0;
  return Math.round(((Number(minutes) / 60) * Number(hourlyRate)) * 100) / 100;
};

/**
 * Calculate billing amount for given seconds and hourly rate
 * @param {number} seconds
 * @param {number} hourlyRate
 * @returns {number}
 */
export const calculateAmountBySeconds = (seconds, hourlyRate) => {
  if (!seconds || seconds <= 0 || !hourlyRate || hourlyRate <= 0) return 0;
  const raw = ((Number(seconds) / 3600) * Number(hourlyRate));
  return Math.max(0.01, Math.round(raw * 100) / 100);
};

/**
 * Format seconds into a friendly human-readable duration (e.g., '2h 15m 30s' or '02:15:30')
 * @param {number} totalSeconds
 * @returns {{ h: number, m: number, s: number, formatted: string, clock: string }}
 */
export const formatDuration = (totalSeconds = 0) => {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  const pad = (n) => String(n).padStart(2, '0');
  return {
    h,
    m,
    s,
    formatted: `${h}h ${m}m ${s}s`,
    clock: `${pad(h)}:${pad(m)}:${pad(s)}`,
  };
};

/**
 * Calculate remaining customer balance
 * @param {number} finalAmount
 * @param {number} totalPaidAmount
 * @returns {number}
 */
export const calculateRemainingBalance = (finalAmount = 0, totalPaidAmount = 0) => {
  const balance = Number(finalAmount) - Number(totalPaidAmount);
  return Math.max(0, Math.round(balance * 100) / 100);
};

/**
 * Calculate Gross Profit: Revenue - Contractor Amount
 * @param {number} revenue
 * @param {number} contractorAmount
 * @returns {number}
 */
export const calculateGrossProfit = (revenue = 0, contractorAmount = 0) => {
  return Math.round((Number(revenue) - Number(contractorAmount)) * 100) / 100;
};

/**
 * Calculate Net Profit: Revenue - Contractor Amount - Expenses
 * @param {number} revenue
 * @param {number} contractorAmount
 * @param {number} expenses
 * @returns {number}
 */
export const calculateNetProfit = (revenue = 0, contractorAmount = 0, expenses = 0) => {
  return Math.round((Number(revenue) - Number(contractorAmount) - Number(expenses)) * 100) / 100;
};
