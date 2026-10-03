const { Op } = require('sequelize');
const { Task } = require('../models');

const WRITABLE = ['title', 'description', 'status', 'priority', 'category', 'dueDate'];
const pick = (src) => Object.fromEntries(WRITABLE.filter((k) => k in src).map((k) => [k, src[k]]));
const withCompletion = (data) => {
  if (data.status === 'completed') data.completedAt = new Date();
  else if (data.status === 'pending') data.completedAt = null;
  return data;
};
// Every query is scoped to the logged-in user so users can never touch each other's tasks.
const findOwned = (req) => Task.findOne({ where: { id: req.params.id, userId: req.user.id } });

exports.list = async (req, res, next) => {
  try {
    const { status, priority, category, search, dueBefore, dueAfter,
            sortBy = 'createdAt', order = 'desc', page = 1, limit = 20 } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (search) where[Op.or] = [{ title: { [Op.like]: `%${search}%` } }, { description: { [Op.like]: `%${search}%` } }];
    if (dueBefore || dueAfter) {
      where.dueDate = {};
      if (dueBefore) where.dueDate[Op.lte] = dueBefore;
      if (dueAfter) where.dueDate[Op.gte] = dueAfter;
    }
    const { rows, count } = await Task.findAndCountAll({
      where, order: [[sortBy, order.toUpperCase()]], limit, offset: (page - 1) * limit,
    });
    res.status(200).json({ data: rows, meta: { total: count, page, limit, pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const task = await findOwned(req);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.status(200).json(task);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const task = await Task.create({ ...withCompletion(pick(req.body)), userId: req.user.id });
    res.status(201).json(task);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const task = await findOwned(req);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await task.update(withCompletion(pick(req.body)));
    res.status(200).json(task);
  } catch (err) { next(err); }
};

exports.setStatus = async (req, res, next) => {
  try {
    const task = await findOwned(req);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await task.update(withCompletion({ status: req.body.status }));
    res.status(200).json(task);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const task = await findOwned(req);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await task.destroy();
    res.status(204).send();
  } catch (err) { next(err); }
};
