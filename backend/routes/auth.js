const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.get('/me', protect, getMe);

module.exports = router;