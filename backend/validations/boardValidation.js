const { body } = require('express-validator');

/**
 * Validation rules for creating a new board.
 */
const createBoardValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Board title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('visibility')
    .optional()
    .isIn(['personal', 'collaborative'])
    .withMessage('Visibility must be "personal" or "collaborative"'),

  body('coverColor')
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .withMessage('coverColor must be a valid hex color (e.g. #2563EB)'),
];

/**
 * Validation rules for updating an existing board.
 * All fields are optional — only provided fields are updated.
 */
const updateBoardValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be blank')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('visibility')
    .optional()
    .isIn(['personal', 'collaborative'])
    .withMessage('Visibility must be "personal" or "collaborative"'),

  body('coverColor')
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .withMessage('coverColor must be a valid hex color'),
];

module.exports = { createBoardValidation, updateBoardValidation };
