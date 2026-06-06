const { ZodError } = require('zod');

const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: 'fail',
        errors: error.errors.map(err => ({
          field: err.path.join('.').replace(/^(body|query|params)\./, ''),
          message: err.message
        }))
      });
    }
    return res.status(500).json({ status: 'error', message: 'Internal validation error' });
  }
};

module.exports = {
  validate
};
