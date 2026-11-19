'use strict';
const { Schema, model } = require('mongoose');

const auditLogSchema = new Schema(
  {
    action: { type: String, required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorEmail: { type: String, default: '' },
    actorRole: { type: String, default: 'anonymous' },
    targetType: { type: String, default: '' },
    targetId: { type: String, default: '' },
    description: { type: String, default: '', maxlength: 500 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
auditLogSchema.index({ createdAt: -1 });

module.exports = model('AuditLog', auditLogSchema);
