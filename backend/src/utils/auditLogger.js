import { AuditLog } from '../models/AuditLog.js';

/**
 * Record an audit log entry safely
 * @param {Object} params
 * @param {string} params.actorUserId
 * @param {string} params.actorRole
 * @param {string} params.action
 * @param {string} params.entity
 * @param {string} params.entityId
 * @param {Object} [params.metadata]
 */
export const logAudit = async ({
  actorUserId,
  actorRole,
  action,
  entity,
  entityId,
  metadata = {},
}) => {
  try {
    // Sanitize metadata to remove any password or token fields
    const sanitizedMeta = { ...metadata };
    delete sanitizedMeta.password;
    delete sanitizedMeta.passwordHash;
    delete sanitizedMeta.newPassword;
    delete sanitizedMeta.token;
    delete sanitizedMeta.secret;

    await AuditLog.create({
      actorUserId: actorUserId || 'SYSTEM',
      actorRole: actorRole || 'SYSTEM',
      action,
      entity,
      entityId: String(entityId),
      metadata: sanitizedMeta,
    });
  } catch (err) {
    // Non-blocking error logging
    console.error('[AuditLogger] Failed to record audit log:', err.message);
  }
};
