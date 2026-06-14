const { body } = require('express-validator');

/**
 * Validation rules for creating or updating a column title.
 * Shared between create and update since both only touch `title`.
 */
const columnTitleValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Column title is required')
    .isLength({ min: 1, max: 60 })
    .withMessage('Column title must be between 1 and 60 characters'),
];

module.exports = { columnTitleValidation };
