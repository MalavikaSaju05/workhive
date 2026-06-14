const { body, query } = require('express-validator');

/**
 * Validation rules for creating a task.
 */
const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('column')
    .notEmpty()
    .withMessage('Column is required')
    .isMongoId()
    .withMessage('Invalid column ID'),

  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be one of: Low, Medium, High, Critical'),

  body('dueDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Due date must be a valid date'),

  body('assignedTo')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid assignedTo user ID'),
];

/**
 * Validation rules for updating a task. All fields optional.
 */
const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be one of: Low, Medium, High, Critical'),

  body('dueDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Due date must be a valid date'),

  body('assignedTo')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid assignedTo user ID'),

  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done'])
    .withMessage('Status must be one of: todo, in_progress, done'),
];

/**
 * Validation rules for moving a task between columns/positions (Phase 5).
 */
const moveTaskValidation = [
  body('column')
    .notEmpty()
    .withMessage('Target column is required')
    .isMongoId()
    .withMessage('Invalid column ID'),
  body('position')
    .notEmpty()
    .withMessage('Target position is required')
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
];

/**
 * Validation rules for adding/editing a comment (Phase 7).
 */
const commentValidation = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
];

/**
 * Validation rules for the task search/filter query (Phase 9).
 * All fields optional — applied as additive filters.
 */
const taskQueryValidation = [
  query('search').optional().trim().isLength({ max: 200 }),
  query('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be one of: Low, Medium, High, Critical'),
  query('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done'])
    .withMessage('Status must be one of: todo, in_progress, done'),
  query('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo user ID'),
  query('dueBefore').optional().isISO8601().withMessage('dueBefore must be a valid date'),
  query('dueAfter').optional().isISO8601().withMessage('dueAfter must be a valid date'),
];

module.exports = {
  createTaskValidation,
  updateTaskValidation,
  moveTaskValidation,
  commentValidation,
  taskQueryValidation,
};
