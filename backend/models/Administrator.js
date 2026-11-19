'use strict';
const { Schema, model } = require('mongoose');

const administratorSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    designation: { type: String, trim: true, maxlength: 100, default: 'Election Administrator' },
    department: { type: String, trim: true, maxlength: 100, default: 'Election Commission' },
  },
  { timestamps: true }
);

module.exports = model('Administrator', administratorSchema);
