const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for different models
const validateWorker = [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('role').notEmpty().withMessage('Role is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('dailySalary').isNumeric().withMessage('Daily salary must be a number'),
  handleValidationErrors
];

const validateProjectOwner = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('address').notEmpty().withMessage('Address is required'),
  handleValidationErrors
];

const validateProject = [
  body('name').notEmpty().withMessage('Project name is required'),
  body('totalAmount').isNumeric().withMessage('Total amount must be a number'),
  body('ownerId').notEmpty().withMessage('Owner ID is required'),
  handleValidationErrors
];

const validateMaterial = [
  body('name').notEmpty().withMessage('Material name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('unitPrice').isNumeric().withMessage('Unit price must be a number'),
  body('projectId').notEmpty().withMessage('Project ID is required'),
  handleValidationErrors
];

const validateAttendance = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('workerId').notEmpty().withMessage('Worker ID is required'),
  body('projectId').notEmpty().withMessage('Project ID is required'),
  body('status').isIn(['present', 'absent', 'halfday']).withMessage('Valid status is required'),
  handleValidationErrors
];

const validateSalary = [
  body('workerId').notEmpty().withMessage('Worker ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  handleValidationErrors
];

const validatePayment = [
  body('projectOwnerId').notEmpty().withMessage('Project owner ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  handleValidationErrors
];

const validateUserRegistration = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'worker']).withMessage('Role must be admin or worker'),
  handleValidationErrors
];

const validateUserLogin = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

module.exports = {
  validateWorker,
  validateProjectOwner,
  validateProject,
  validateMaterial,
  validateAttendance,
  validateSalary,
  validatePayment,
  validateUserRegistration,
  validateUserLogin
};