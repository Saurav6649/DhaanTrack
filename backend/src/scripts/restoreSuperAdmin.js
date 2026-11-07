import bcrypt from 'bcrypt';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { ROLES } from '../config/constants.js';
import { logAudit } from '../utils/auditLogger.js';

export const SUPER_ADMIN_DETAILS = {
  name: 'DhaanTrack Super Admin',
  userId: 'superadmin',
  email: 'superadmin@dhaantrack.com',
  mobile: '9876543211',
  role: ROLES.SUPER_ADMIN,
};

// Secure temporary password (can be overridden via environment variable)
export const DEFAULT_SUPER_ADMIN_TEMP_PASSWORD =
  process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@Dhaan2026!Sec';

export const restoreSuperAdmin = async (tempPassword = DEFAULT_SUPER_ADMIN_TEMP_PASSWORD) => {
  // Check if Super Admin already exists by email, userId, or role
  let existing = await User.findOne({
    $or: [
      { email: SUPER_ADMIN_DETAILS.email },
      { userId: SUPER_ADMIN_DETAILS.userId },
      { role: ROLES.SUPER_ADMIN },
    ],
  });

  if (existing) {
    let wasRestored = false;
    // If the account was soft-deleted, reactivate and restore it
    if (existing.isDeleted || existing.status !== 'ACTIVE') {
      existing.isDeleted = false;
      existing.deletedAt = null;
      existing.deletedBy = null;
      existing.deletedByName = null;
      existing.deletedByRole = null;
      existing.status = 'ACTIVE';
      await existing.save();
      wasRestored = true;
    }

    console.log(
      `[RestoreSuperAdmin] Super Admin account already exists (ID: ${existing.userId}, Email: ${existing.email || SUPER_ADMIN_DETAILS.email}). Status: ACTIVE. ${wasRestored ? 'Reactivated from deleted state.' : 'No duplicate created.'}`
    );

    return { user: existing, created: false, restored: wasRestored };
  }

  // Generate secure password hash
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(tempPassword, salt);

  const superAdmin = await User.create({
    name: SUPER_ADMIN_DETAILS.name,
    userId: SUPER_ADMIN_DETAILS.userId,
    email: SUPER_ADMIN_DETAILS.email,
    passwordHash,
    role: ROLES.SUPER_ADMIN,
    mobile: SUPER_ADMIN_DETAILS.mobile,
    status: 'ACTIVE',
    mustChangePassword: true,
    isDeleted: false,
  });

  await logAudit({
    actorUserId: 'SYSTEM',
    actorRole: 'SYSTEM',
    action: 'SUPER_ADMIN_RESTORE',
    entity: 'User',
    entityId: superAdmin._id,
    metadata: {
      userId: superAdmin.userId,
      email: superAdmin.email,
      role: superAdmin.role,
    },
  });

  console.log(`[RestoreSuperAdmin] Successfully created Super Admin account: ${superAdmin.userId} (${superAdmin.email})`);
  return { user: superAdmin, created: true, restored: false };
};

const run = async () => {
  try {
    await connectDB();
    await restoreSuperAdmin();
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[RestoreSuperAdmin] Failed to restore Super Admin:', err.message);
    process.exit(1);
  }
};

if (process.argv[1]?.endsWith('restoreSuperAdmin.js')) {
  run();
}
