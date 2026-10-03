const router = require('express').Router();
const ctrl = require('../controllers/authController');
const v = require('../validators/authValidators');
const validate = require('../middleware/validate');

router.post('/register', v.register, validate, ctrl.register);
router.post('/login', v.login, validate, ctrl.login);

module.exports = router;
