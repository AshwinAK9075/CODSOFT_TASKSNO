const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const sign = (user) =>
  jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ where: { email } })) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    res.status(201).json({ user, token: sign(user) });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.status(200).json({ user, token: sign(user) });
  } catch (err) { next(err); }
};
