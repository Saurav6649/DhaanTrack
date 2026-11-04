import { Contractor } from '../models/Contractor.js';
import { Machine } from '../models/Machine.js';
import { logAudit } from '../utils/auditLogger.js';

export const createContractor = async (data, actor) => {
  const contractor = await Contractor.create({
    name: data.name,
    mobile: data.mobile,
    paymentRate: data.paymentRate || 0,
    assignedMachines: data.assignedMachines || [],
    status: data.status || 'ACTIVE',
  });

  if (data.assignedMachines && data.assignedMachines.length > 0) {
    await Machine.updateMany(
      { _id: { $in: data.assignedMachines } },
      { $set: { contractorId: contractor._id } }
    );
  }

  await logAudit({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: 'CONTRACTOR_CREATED',
    entity: 'Contractor',
    entityId: contractor._id,
    metadata: { name: contractor.name, mobile: contractor.mobile },
  });

  return contractor;
};

export const getAllContractors = async () => {
  return await Contractor.find()
    .populate('assignedMachines', 'machineName machineNumber status')
    .sort({ createdAt: -1 });
};

export const getContractorById = async (id) => {
  const contractor = await Contractor.findById(id).populate(
    'assignedMachines',
    'machineName machineNumber status'
  );
  if (!contractor) throw new Error('Contractor not found.');
  return contractor;
};

export const updateContractor = async (id, data, actor) => {
  const contractor = await Contractor.findById(id);
  if (!contractor) throw new Error('Contractor not found.');

  const updated = await Contractor.findByIdAndUpdate(id, { $set: data }, { new: true }).populate(
    'assignedMachines',
    'machineName machineNumber status'
  );

  if (data.assignedMachines) {
    await Machine.updateMany(
      { _id: { $in: data.assignedMachines } },
      { $set: { contractorId: id } }
    );
  }

  await logAudit({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: 'CONTRACTOR_UPDATED',
    entity: 'Contractor',
    entityId: id,
    metadata: { updatedFields: Object.keys(data) },
  });

  return updated;
};
