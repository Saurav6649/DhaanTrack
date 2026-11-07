import { connectDB, disconnectDB } from '../config/db.js';
import { WorkSession } from '../models/WorkSession.js';
import { WORK_STATUS } from '../config/constants.js';

export const resetTestSessions = async () => {
  try {
    await connectDB();

    // Complete any active or paused sessions to ensure a clean state
    await WorkSession.updateMany(
      { status: { $in: [WORK_STATUS.IN_PROGRESS, WORK_STATUS.PAUSED] } },
      { status: WORK_STATUS.COMPLETED, completedAt: new Date() }
    );

    // Reset Pawan Kumar session to PENDING (unstarted)
    await WorkSession.updateOne(
      { customerName: /Pawan kumar/i },
      {
        status: WORK_STATUS.PENDING,
        totalWorkedSeconds: 0,
        startedAt: null,
        completedAt: null,
        lastResumeTime: null,
        finalAmount: 0,
        advanceAmount: 0,
        totalPaidAmount: 0,
      }
    );

    console.log('[ResetTestSessions] Reset active sessions and prepared Pawan Kumar as PENDING.');
    await disconnectDB();
  } catch (err) {
    console.error('[ResetTestSessions] Error:', err);
    process.exit(1);
  }
};

if (process.argv[1]?.includes('resetTestSessions.js')) {
  resetTestSessions();
}
