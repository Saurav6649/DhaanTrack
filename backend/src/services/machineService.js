import { Machine } from '../models/Machine.js';
import { User } from '../models/User.js';
import { Contractor } from '../models/Contractor.js';
import { logAudit } from '../utils/auditLogger.js';

export const createMachine = async (data, actor) => {
  const existing = await Machine.findOne({ machineNumber: data.machineNumber.toUpperCase() });
  if (existing) {
    throw new Error(`Machine with number "${data.machineNumber}" already exists.`);
  }

  const machine = await Machine.create({
    machineName: data.machineName,
    machineNumber: data.machineNumber.toUpperCase(),
    capacityPerHour: data.capacityPerHour || 1.0,
    customerHourlyRate: data.customerHourlyRate,
    contractorHourlyRate: data.contractorHourlyRate,
    contractorId: data.contractorId || null,
    assignedUser: data.assignedUser || null,
    status: data.status || 'ACTIVE',
  });

  if (data.assignedUser) {
    await User.findByIdAndUpdate(data.assignedUser, { assignedMachine: machine._id });
  }

  if (data.contractorId) {
    await Contractor.findByIdAndUpdate(data.contractorId, {
      $addToSet: { assignedMachines: machine._id },
    });
  }

  await logAudit({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: 'MACHINE_CREATED',
    entity: 'Machine',
    entityId: machine._id,
    metadata: { machineName: machine.machineName, machineNumber: machine.machineNumber },
  });

  return machine;
};

export const getAllMachines = async () => {
  return await Machine.find({ isDeleted: { $ne: true } })
    .populate('assignedUser', 'name userId mobile status')
    .populate('contractorId', 'name mobile paymentRate')
    .sort({ createdAt: -1 });
};

export const getMachineById = async (id) => {
  const machine = await Machine.findOne({ _id: id, isDeleted: { $ne: true } })
    .populate('assignedUser', 'name userId mobile status')
    .populate('contractorId', 'name mobile paymentRate');
  if (!machine) throw new Error('Machine not found.');
  return machine;
};

export const updateMachine = async (id, data, actor) => {
  const machine = await Machine.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!machine) throw new Error('Machine not found.');

  // Check unique machine number if updated
  if (data.machineNumber && data.machineNumber.toUpperCase() !== machine.machineNumber) {
    const existing = await Machine.findOne({
      machineNumber: data.machineNumber.toUpperCase(),
      _id: { $ne: id },
      isDeleted: { $ne: true },
    });
    if (existing) throw new Error(`Machine number ${data.machineNumber} is already in use.`);
    data.machineNumber = data.machineNumber.toUpperCase();
  }

  // Handle assigned user update
  if (data.assignedUser !== undefined && String(data.assignedUser) !== String(machine.assignedUser)) {
    if (machine.assignedUser) {
      await User.findByIdAndUpdate(machine.assignedUser, { assignedMachine: null });
    }
    if (data.assignedUser) {
      await User.findByIdAndUpdate(data.assignedUser, { assignedMachine: machine._id });
    }
  }

  const updated = await Machine.findByIdAndUpdate(id, { $set: data }, { new: true })
    .populate('assignedUser', 'name userId mobile status')
    .populate('contractorId', 'name mobile paymentRate');

  await logAudit({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: 'MACHINE_UPDATED',
    entity: 'Machine',
    entityId: machine._id,
    metadata: { updatedFields: Object.keys(data) },
  });

  return updated;
};

export const deleteMachine = async (id, actor) => {
  const machine = await Machine.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!machine) throw new Error('Machine not found.');

  machine.isDeleted = true;
  machine.deletedAt = new Date();
  machine.deletedBy = actor._id;
  machine.deletedByName = actor.name;
  machine.deletedByRole = actor.role;

  // If machine had assigned operator, unlink operator's assigned machine
  if (machine.assignedUser) {
    await User.findByIdAndUpdate(machine.assignedUser, { assignedMachine: null });
  }

  await machine.save();

  await logAudit({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: 'MACHINE_DELETED',
    entity: 'Machine',
    entityId: machine._id,
    metadata: { machineName: machine.machineName, machineNumber: machine.machineNumber },
  });

  return machine;
};
