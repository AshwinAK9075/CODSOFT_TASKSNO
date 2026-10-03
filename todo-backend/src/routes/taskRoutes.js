const router = require('express').Router();
const ctrl = require('../controllers/taskController');
const v = require('../validators/taskValidators');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', v.list, validate, ctrl.list);
router.post('/', v.create, validate, ctrl.create);
router.get('/:id', v.idOnly, validate, ctrl.get);
router.put('/:id', v.update, validate, ctrl.update);
router.patch('/:id', v.update, validate, ctrl.update);
router.patch('/:id/status', v.setStatus, validate, ctrl.setStatus);
router.delete('/:id', v.idOnly, validate, ctrl.remove);

module.exports = router;
