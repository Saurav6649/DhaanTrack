import { MasterData } from '../models/MasterData.js';
import { DEFAULT_CONFIG, EXPENSE_CATEGORIES, PAYMENT_MODES } from '../config/constants.js';
import { logAudit } from '../utils/auditLogger.js';

export const getMasterDataList = async () => {
  const records = await MasterData.find();
  const map = {};
  records.forEach((r) => {
    map[r.key] = r.value;
  });

  return {
    kathaPerAcre: map.kathaPerAcre || DEFAULT_CONFIG.kathaPerAcre,
    machineCapacityPerHour: map.machineCapacityPerHour || DEFAULT_CONFIG.machineCapacityPerHour,
    expenseCategories: EXPENSE_CATEGORIES,
    paymentModes: Object.values(PAYMENT_MODES),
    allConfigs: records,
  };
};

export const updateMasterData = async (key, value, description, actor) => {
  const updated = await MasterData.findOneAndUpdate(
    { key },
    { key, value, ...(description ? { description } : {}) },
    { upsert: true, new: true }
  );

  await logAudit({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: 'MASTER_DATA_UPDATED',
    entity: 'MasterData',
    entityId: key,
    metadata: { key, value },
  });

  return updated;
};
