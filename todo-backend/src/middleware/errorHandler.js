exports.notFound = (req, res) =>
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });

exports.errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Resource already exists' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
