'use strict';
const { Schema, model } = require('mongoose');

const candidateSchema = new Schema(
  {
    election: { type: Schema.Types.ObjectId, ref: 'Election', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    party: { type: String, trim: true, maxlength: 100, default: 'Independent' },
    symbol: { type: String, trim: true, maxlength: 40, default: '' },
    manifesto: { type: String, trim: true, maxlength: 4000, default: '' },
    biography: { type: String, trim: true, maxlength: 2000, default: '' },
    // Photograph stored in MongoDB so it survives ephemeral hosting disks (e.g. Render free tier).
    photo: {
      data: { type: Buffer, select: false },
      contentType: { type: String, select: false },
    },
    hasPhoto: { type: Boolean, default: false },
    isDevSample: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);
candidateSchema.index({ election: 1, name: 1 }, { unique: true });
candidateSchema.virtual('photoUrl').get(function photoUrl() {
  return this.hasPhoto ? `/api/candidates/${this._id}/photo` : null;
});

module.exports = model('Candidate', candidateSchema);
