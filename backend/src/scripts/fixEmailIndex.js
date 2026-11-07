import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';

const run = async () => {
  try {
    await connectDB();
    console.log('[FixEmailIndex] Connected to MongoDB');

    // 1. Unset null or empty email fields
    const res = await User.updateMany(
      { $or: [{ email: null }, { email: '' }] },
      { $unset: { email: '' } }
    );
    console.log(`[FixEmailIndex] Unset email for ${res.modifiedCount} users.`);

    // 2. Drop existing email_1 index if it exists without sparse
    try {
      await User.collection.dropIndex('email_1');
      console.log('[FixEmailIndex] Dropped old email_1 index.');
    } catch (e) {
      console.log('[FixEmailIndex] No existing email_1 index to drop or already dropped:', e.message);
    }

    // 3. Recreate index as unique and sparse
    await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log('[FixEmailIndex] Created unique sparse index on email.');

    const indexes = await User.collection.indexes();
    console.log('[FixEmailIndex] Updated indexes:', JSON.stringify(indexes, null, 2));

    await disconnectDB();
    console.log('[FixEmailIndex] Done.');
  } catch (err) {
    console.error('[FixEmailIndex] Error:', err);
    process.exit(1);
  }
};

run();
