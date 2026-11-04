import { describe, it, expect } from 'vitest';
import {
  kathaToAcre,
  calculateEstimatedHours,
  calculateExpectedAmount,
  calculateTimeDifference,
  calculateAmountByMinutes,
  calculateAmountBySeconds,
  formatDuration,
  calculateGrossProfit,
  calculateNetProfit,
  calculateRemainingBalance,
} from '../src/utils/calculator.js';

describe('Calculator Utilities', () => {
  it('converts Katha to Acre correctly with custom and default conversion rates', () => {
    // 32 katha = 1 acre default
    expect(kathaToAcre(32, 32)).toBe(1);
    expect(kathaToAcre(16, 32)).toBe(0.5);
    expect(kathaToAcre(48, 32)).toBe(1.5);
    // Custom regional rate e.g. 20 katha per acre
    expect(kathaToAcre(20, 20)).toBe(1);
    expect(kathaToAcre(0, 32)).toBe(0);
  });

  it('calculates estimated working hours based on acreage and machine capacity', () => {
    // 2 acres at 1 acre/hour = 2 hours
    expect(calculateEstimatedHours(2, 1)).toBe(2);
    // 2.5 acres at 1.25 acre/hour = 2 hours
    expect(calculateEstimatedHours(2.5, 1.25)).toBe(2);
    expect(calculateEstimatedHours(0, 1)).toBe(0);
  });

  it('calculates expected customer amount based on hours and hourly rate', () => {
    expect(calculateExpectedAmount(2.5, 2000)).toBe(5000);
    expect(calculateExpectedAmount(1.33, 1500)).toBe(1995);
  });

  it('calculates time difference within same day accurately', () => {
    const res = calculateTimeDifference('09:00', '11:30');
    expect(res.minutes).toBe(150);
    expect(res.hours).toBe(2.5);
    expect(res.formatted).toBe('2h 30m');
  });

  it('handles midnight-crossing time calculation seamlessly', () => {
    // Start at 22:30 (10:30 PM), finish at 02:00 AM next day -> 3.5 hours = 210 minutes
    const res = calculateTimeDifference('22:30', '02:00');
    expect(res.minutes).toBe(210);
    expect(res.hours).toBe(3.5);
    expect(res.formatted).toBe('3h 30m');
  });

  it('calculates billing by minutes correctly', () => {
    // 90 minutes at Rs 2000/hr = Rs 3000
    expect(calculateAmountByMinutes(90, 2000)).toBe(3000);
    // 45 minutes at Rs 1800/hr = Rs 1350
    expect(calculateAmountByMinutes(45, 1800)).toBe(1350);
  });

  it('calculates billing by seconds correctly', () => {
    // 3600 seconds (1 hour) at Rs 2500 = Rs 2500
    expect(calculateAmountBySeconds(3600, 2500)).toBe(2500);
    // 1800 seconds (0.5 hour) at Rs 2500 = Rs 1250
    expect(calculateAmountBySeconds(1800, 2500)).toBe(1250);
  });

  it('formats duration in seconds to clock format and human readable', () => {
    const formatted = formatDuration(3725); // 1h 2m 5s
    expect(formatted.h).toBe(1);
    expect(formatted.m).toBe(2);
    expect(formatted.s).toBe(5);
    expect(formatted.formatted).toBe('1h 2m 5s');
    expect(formatted.clock).toBe('01:02:05');
  });

  it('calculates Gross and Net Profit correctly', () => {
    const revenue = 10000;
    const contractor = 4000;
    const expenses = 1500;

    const gross = calculateGrossProfit(revenue, contractor);
    expect(gross).toBe(6000); // 10000 - 4000

    const net = calculateNetProfit(revenue, contractor, expenses);
    expect(net).toBe(4500); // 10000 - 4000 - 1500
  });

  it('calculates customer remaining balance without negative values', () => {
    expect(calculateRemainingBalance(5000, 2000)).toBe(3000);
    expect(calculateRemainingBalance(5000, 5000)).toBe(0);
    expect(calculateRemainingBalance(5000, 6000)).toBe(0);
  });
});
