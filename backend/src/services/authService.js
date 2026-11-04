import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { MasterData } from '../models/MasterData.js';
import { ROLES, DEFAULT_CONFIG } from '../config/constants.js';
import { ENV } from '../config/env.js';
import { generateToken } from '../utils/jwt.js';
import { logAudit } from '../utils/auditLogger.js';

export const login = async ({ userId, password }) => {
  const user = await User.findOne({ userId: userId.toLowerCase() }).select('+passwordHash').populate('assignedMachine');

  if (!user) {
    throw new Error('Invalid User ID or Password.');
  }

  if (user.status === 'DISABLED') {
    throw new Error('This account has been disabled. Please contact the administrator.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid User ID or Password.');
  }

  const token = generateToken({
    id: user._id,
    userId: user.userId,
    role: user.role,
  });

  await logAudit({
    actorUserId: user.userId,
    actorRole: user.role,
    action: 'USER_LOGIN',
    entity: 'User',
    entityId: user._id,
    metadata: { ip: 'authenticated' },
  });

  const userObj = user.toJSON();
  return { user: userObj, token };
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new Error('User not found.');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new Error('Current password is incorrect.');
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();

  await logAudit({
    actorUserId: user.userId,
    actorRole: user.role,
    action: 'PASSWORD_CHANGED',
    entity: 'User',
    entityId: user._id,
  });

  return { success: true, message: 'Password updated successfully.' };
};

export const bootstrapAdmin = async () => {
  // Ensure default master data exists
  const kathaConfig = await MasterData.findOne({ key: 'kathaPerAcre' });
  if (!kathaConfig) {
    await MasterData.create({
      key: 'kathaPerAcre',
      value: DEFAULT_CONFIG.kathaPerAcre,
      description: 'Local Katha to Acre conversion factor (e.g. 32 Katha = 1 Acre)',
    });
  }

  const capacityConfig = await MasterData.findOne({ key: 'machineCapacityPerHour' });
  if (!capacityConfig) {
    await MasterData.create({
      key: 'machineCapacityPerHour',
      value: DEFAULT_CONFIG.machineCapacityPerHour,
      description: 'Default machine harvesting capacity in Acres per Hour',
    });
  }

  // Check if any admin exists
  let admin = await User.findOne({ role: ROLES.ADMIN });
  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ENV.BOOTSTRAP_ADMIN_PASSWORD, salt);

    admin = await User.create({
      name: ENV.BOOTSTRAP_ADMIN_NAME,
      userId: ENV.BOOTSTRAP_ADMIN_USER_ID.toLowerCase(),
      passwordHash,
      role: ROLES.ADMIN,
      mobile: ENV.BOOTSTRAP_ADMIN_MOBILE,
      status: 'ACTIVE',
    });

    console.log(`[Bootstrap] Initial Admin user created: ${admin.userId}`);
    await logAudit({
      actorUserId: 'SYSTEM',
      actorRole: 'SYSTEM',
      action: 'ADMIN_BOOTSTRAP',
      entity: 'User',
      entityId: admin._id,
      metadata: { adminUserId: admin.userId },
    });
  }

  // Ensure a default harvester machine and operator exist for instant testing
  const { Machine } = await import('../models/Machine.js');
  let defaultMachine = await Machine.findOne({ machineNumber: 'HARV-01' });
  if (!defaultMachine) {
    defaultMachine = await Machine.create({
      machineName: 'Kubota Harvester DC-68G',
      machineNumber: 'HARV-01',
      capacityPerHour: 1.0,
      customerHourlyRate: 2500,
      contractorHourlyRate: 1500,
      status: 'ACTIVE',
    });
  }

  const existingOp = await User.findOne({ userId: 'operator1' });
  if (!existingOp) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Operator@123', salt);
    const op = await User.create({
      name: 'Ramesh Operator',
      userId: 'operator1',
      passwordHash,
      role: ROLES.USER,
      mobile: '9876543210',
      assignedMachine: defaultMachine._id,
      status: 'ACTIVE',
    });
    defaultMachine.assignedUser = op._id;
    await defaultMachine.save();
    console.log('[Bootstrap] Default operator created: operator1');
  }

  return admin;
};
