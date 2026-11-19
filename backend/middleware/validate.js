'use strict';
const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

/** validate(schema, 'body' | 'query' | 'params') – replaces the source with the parsed (typed, trimmed) value. */
const validate = (schema, source = 'body') => (req, _res, next) => {
  try {
    const parsed = schema.parse(req[source]);
    if (source === 'query') {
      Object.keys(req.query).forEach((k) => delete req.query[k]);
      Object.assign(req.query, parsed);
    } else {
      req[source] = parsed;
    }
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const fields = {};
      err.issues.forEach((i) => { const k = i.path.join('.') || '_'; if (!fields[k]) fields[k] = i.message; });
      return next(new AppError('Please correct the highlighted fields.', 400, 'VALIDATION_ERROR', { fields }));
    }
    return next(err);
  }
};

module.exports = validate;
