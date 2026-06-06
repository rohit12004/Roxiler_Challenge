const { z } = require('zod');

// Password validation: 8-16 characters, 1 uppercase, 1 special character
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(16, 'Password must not exceed 16 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

const registerSchema = z.object({
  body: z.object({
    name: z.string()
      .min(20, 'Name must be at least 20 characters long')
      .max(60, 'Name must not exceed 60 characters'),
    email: z.string().email('Invalid email format'),
    password: passwordSchema,
    address: z.string().max(400, 'Address must not exceed 400 characters'),
    role: z.enum(['user'], {
      errorMap: () => ({ message: 'Role must be user' })
    })
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  })
});

const adminCreateUserSchema = z.object({
  body: z.object({
    name: z.string()
      .min(20, 'Name must be at least 20 characters long')
      .max(60, 'Name must not exceed 60 characters'),
    email: z.string().email('Invalid email format'),
    password: passwordSchema.optional().or(z.literal('')),
    address: z.string().max(400, 'Address must not exceed 400 characters'),
    role: z.enum(['user', 'admin', 'owner'], {
      errorMap: () => ({ message: 'Role must be user, admin, or owner' })
    })
  })
});

const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema
  })
});

const submitRatingSchema = z.object({
  body: z.object({
    storeId: z.string().uuid('Invalid Store ID format'),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must not exceed 5'),
    reviewText: z.string().max(400, 'Review must not exceed 400 characters').optional()
  })
});

const adminResetPasswordSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid User ID format')
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  adminCreateUserSchema,
  updatePasswordSchema,
  submitRatingSchema,
  adminResetPasswordSchema
};
