import { connectDB, disconnectDB } from '../config/db.js';
import { bootstrapAdmin } from '../services/authService.js';

const run = async () => {
  try {
    await connectDB();
    const admin = await bootstrapAdmin();
    console.log(`[Bootstrap] Successfully verified or created admin user: ${admin.userId}`);
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Bootstrap] Failed to bootstrap admin:', err.message);
    process.exit(1);
  }
};

if (process.argv[1]?.endsWith('bootstrapAdmin.js')) {
  run();
}
