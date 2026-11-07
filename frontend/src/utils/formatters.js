/**
 * DhaanTrack Formatting Utilities
 */

/**
 * Format today's total working hours for Assigned Harvester Machine card
 * Expected format:
 * 0 mins   -> "0 hrs 0 min"
 * 5 mins   -> "0 hrs 5 min"
 * 30 mins  -> "0 hrs 30 min"
 * 60 mins  -> "1 hr 0 min"
 * 90 mins  -> "1 hr 30 min"
 * 125 mins -> "2 hrs 5 min"
 * @param {number} seconds
 * @returns {string}
 */
export const formatMachineWorkingHours = (seconds = 0) => {
  const totalMinutes = Math.floor(Math.max(0, Number(seconds) || 0) / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const hrLabel = h === 1 ? 'hr' : 'hrs';
  return `${h} ${hrLabel} ${m} min`;
};

/**
 * Format running project card duration
 * Expected format:
 * "0h 5m", "0h 15m", "1h 20m", "2h 35m"
 * @param {number} seconds
 * @returns {string}
 */
export const formatRunningDuration = (seconds = 0) => {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
};

/**
 * Format project start time in 12-hour AM/PM format
 * Examples: "7:33 AM", "10:15 AM", "2:45 PM"
 * @param {string|Date} timestamp
 * @returns {string|null}
 */
export const formatStartTime = (timestamp) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return null;

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
};

/**
 * Format calculator duration into whole hours and remaining minutes
 * Examples:
 * 30  -> "30 Minutes"
 * 45  -> "45 Minutes"
 * 60  -> "1 Hour"
 * 90  -> "1 Hour 30 Minutes"
 * 120 -> "2 Hours"
 * 150 -> "2 Hours 30 Minutes"
 * 180 -> "3 Hours"
 * 125 -> "2 Hours 5 Minutes"
 * @param {number} totalMinutes
 * @returns {string}
 */
export const formatCalculatorDuration = (totalMinutes = 0) => {
  const mins = Math.max(0, Math.round(Number(totalMinutes) || 0));
  if (mins === 0) return '0 Minutes';
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours === 0) {
    return `${remainingMins} ${remainingMins === 1 ? 'Minute' : 'Minutes'}`;
  }
  const hourText = `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
  if (remainingMins === 0) {
    return hourText;
  }
  const minText = `${remainingMins} ${remainingMins === 1 ? 'Minute' : 'Minutes'}`;
  return `${hourText} ${minText}`;
};

/**
 * Format created date in readable format: "6 Nov 2026"
 * @param {string|Date} timestamp
 * @returns {string}
 */
export const formatCreatedDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};
