'use strict';
const { Schema, model } = require('mongoose');

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    handled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model('ContactMessage', contactMessageSchema);
