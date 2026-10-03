const { body, param, query } = require('express-validator');

const STATUS = ['pending', 'completed'];
const PRIORITY = ['low', 'medium', 'high'];

const id = param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt();

const fields = (required) => {
  const title = body('title');
  return [
    required
      ? title.trim().notEmpty().withMessage('title is required').bail().isLength({ max: 200 })
      : title.optional().trim().notEmpty().withMessage('title cannot be empty').isLength({ max: 200 }),
    body('description').optional({ nullable: true }).isString().isLength({ max: 2000 }),
    body('status').optional().isIn(STATUS).withMessage(`status must be one of: ${STATUS.join(', ')}`),
    body('priority').optional().isIn(PRIORITY).withMessage(`priority must be one of: ${PRIORITY.join(', ')}`),
    body('category').optional({ nullable: true }).isString().trim().isLength({ max: 50 }),
    body('dueDate').optional({ nullable: true }).isISO8601({ strict: true }).withMessage('dueDate must be YYYY-MM-DD'),
  ];
};

exports.create = fields(true);
exports.update = [id, ...fields(false)];
exports.idOnly = [id];
exports.setStatus = [id, body('status').isIn(STATUS).withMessage(`status must be one of: ${STATUS.join(', ')}`)];
exports.list = [
  query('status').optional().isIn(STATUS),
  query('priority').optional().isIn(PRIORITY),
  query('category').optional().isString().trim(),
  query('search').optional().isString().trim(),
  query('dueBefore').optional().isISO8601({ strict: true }),
  query('dueAfter').optional().isISO8601({ strict: true }),
  query('sortBy').optional().isIn(['createdAt', 'dueDate', 'priority', 'title']),
  query('order').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];
