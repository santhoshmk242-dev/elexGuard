'use strict';
const { z } = require('zod');

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid identifier');
const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);
const password = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/[0-9]/, 'Password needs a number')
  .regex(/[^A-Za-z0-9]/, 'Password needs a special character');
const phone = z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number').optional().or(z.literal(''));
const otp = z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits');
const date = z.coerce.date({ invalid_type_error: 'Enter a valid date' });
const name = (min = 2, max = 100) => z.string().trim().min(min, `Must be at least ${min} characters`).max(max, `Must be at most ${max} characters`);

const auth = {
  register: z.object({
    fullName: name(),
    email,
    password,
    phone,
    voterIdNumber: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{6,20}$/, 'Voter ID must be 6–20 letters, digits or hyphens'),
    dateOfBirth: date.refine((d) => {
      const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 18 && age < 120;
    }, 'You must be at least 18 years old to register'),
    constituency: objectId,
    address: z.string().trim().max(300).optional().default(''),
  }),
  login: z.object({ email, password: z.string().min(1, 'Password is required').max(200) }),
  verifyOtp: z.object({ email, otp }),
  resendOtp: z.object({ email }),
  forgot: z.object({ email }),
  reset: z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid reset link'), password }),
  profile: z.object({
    fullName: name().optional(),
    phone,
    address: z.string().trim().max(300).optional(),
    designation: z.string().trim().max(100).optional(),
  }),
  changePassword: z.object({ currentPassword: z.string().min(1).max(200), newPassword: password }),
};

const election = {
  create: z.object({
    title: name(3, 150),
    description: z.string().trim().max(2000).optional().default(''),
    type: z.enum(['general', 'regional', 'local', 'referendum', 'student']).default('general'),
    constituencies: z.array(objectId).max(200).default([]),
    startTime: date,
    endTime: date,
  }).refine((v) => v.endTime > v.startTime, { path: ['endTime'], message: 'End time must be after start time' }),
  update: z.object({
    title: name(3, 150).optional(),
    description: z.string().trim().max(2000).optional(),
    type: z.enum(['general', 'regional', 'local', 'referendum', 'student']).optional(),
    constituencies: z.array(objectId).max(200).optional(),
    startTime: date.optional(),
    endTime: date.optional(),
  }),
  duration: z.object({ endTime: date }),
};

const constituency = {
  create: z.object({
    name: name(2, 120),
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,20}$/, 'Code must be 2–20 letters, digits or hyphens'),
    region: z.string().trim().max(120).optional().default(''),
    description: z.string().trim().max(500).optional().default(''),
  }),
};
constituency.update = constituency.create.partial();

const candidate = {
  create: z.object({
    election: objectId,
    name: name(),
    party: z.string().trim().max(100).optional().default('Independent'),
    symbol: z.string().trim().max(40).optional().default(''),
    manifesto: z.string().trim().max(4000).optional().default(''),
    biography: z.string().trim().max(2000).optional().default(''),
  }),
  update: z.object({
    name: name().optional(),
    party: z.string().trim().max(100).optional(),
    symbol: z.string().trim().max(40).optional(),
    manifesto: z.string().trim().max(4000).optional(),
    biography: z.string().trim().max(2000).optional(),
  }),
};

const voter = {
  reject: z.object({ reason: z.string().trim().min(3, 'Please give a reason').max(300) }),
};

const vote = {
  submit: z.object({ candidateId: objectId, ballotToken: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid ballot session') }),
};

const contact = z.object({
  name: name(),
  email,
  subject: name(3, 150),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
});

const notice = z.object({
  title: name(3, 150),
  body: z.string().trim().max(1000).optional().default(''),
  kind: z.enum(['info', 'election', 'result', 'maintenance']).default('info'),
});

const idParam = z.object({ id: objectId });

module.exports = { auth, election, constituency, candidate, voter, vote, contact, notice, idParam, objectId };
