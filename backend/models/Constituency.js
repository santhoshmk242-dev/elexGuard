'use strict';
const { Schema, model } = require('mongoose');

const constituencySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20, match: /^[A-Z0-9-]+$/ },
    region: { type: String, trim: true, maxlength: 120, default: '' },
    description: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);
constituencySchema.index({ name: 1 });

module.exports = model('Constituency', constituencySchema);
