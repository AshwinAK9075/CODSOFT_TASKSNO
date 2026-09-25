'use strict';

const { Op } = require('sequelize');
const config = require('../config/env');
const ApiError = require('./ApiError');

// SQLite's LIKE is already case-insensitive for ASCII; Postgres needs ILIKE.
const likeOperator = config.db.dialect === 'postgres' ? Op.iLike : Op.like;

/**
 * Translates query-string parameters into Sequelize findAndCountAll options.
 *
 * Supported parameters
 *   page      1-based page number                         ?page=2
 *   limit     page size (capped by MAX_PAGE_SIZE)         ?limit=25
 *   sort      comma list, "-" prefix = DESC               ?sort=-createdAt,lastName
 *   search    case-insensitive partial match             ?search=anita
 *   <field>   exact / range filters                       ?status=active&credits[gte]=3
 *
 * Only fields explicitly allow-listed by the caller are honoured, so a client
 * can never filter or sort by an unexpected column.
 */
function buildQueryOptions(query, { searchable = [], filterable = [], sortable = [] } = {}) {
  const page = parsePositiveInt(query.page, 1, 'page');
  const requestedLimit = parsePositiveInt(query.limit, config.pagination.defaultLimit, 'limit');
  const limit = Math.min(requestedLimit, config.pagination.maxLimit);
  const offset = (page - 1) * limit;

  const where = {};
  const conditions = [];

  // ---- search -------------------------------------------------------------
  const term = typeof query.search === 'string' ? query.search.trim() : '';
  if (term && searchable.length) {
    conditions.push({
      [Op.or]: searchable.map((field) => ({ [field]: { [likeOperator]: `%${term}%` } })),
    });
  }

  // ---- filters ------------------------------------------------------------
  const operatorMap = { gt: Op.gt, gte: Op.gte, lt: Op.lt, lte: Op.lte, ne: Op.ne };

  for (const field of filterable) {
    const value = query[field];
    if (value === undefined || value === '') continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Range syntax: ?credits[gte]=3&credits[lt]=5
      const clause = {};
      for (const [op, raw] of Object.entries(value)) {
        if (!operatorMap[op]) {
          throw ApiError.badRequest(`Unsupported filter operator "${op}" on "${field}"`);
        }
        clause[operatorMap[op]] = raw;
      }
      where[field] = clause;
    } else if (typeof value === 'string' && value.includes(',')) {
      // Multi-value syntax: ?status=active,graduated
      where[field] = { [Op.in]: value.split(',').map((v) => v.trim()).filter(Boolean) };
    } else {
      where[field] = value;
    }
  }

  if (conditions.length) {
    return { page, limit, offset, where: { [Op.and]: [where, ...conditions] }, order: buildOrder(query.sort, sortable) };
  }

  return { page, limit, offset, where, order: buildOrder(query.sort, sortable) };
}

function buildOrder(sortParam, sortable) {
  if (!sortParam) return [['createdAt', 'DESC']];

  return String(sortParam)
    .split(',')
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      const direction = raw.startsWith('-') ? 'DESC' : 'ASC';
      const field = raw.replace(/^[-+]/, '');
      if (!sortable.includes(field)) {
        throw ApiError.badRequest(
          `Cannot sort by "${field}". Allowed fields: ${sortable.join(', ')}`
        );
      }
      return [field, direction];
    });
}

function parsePositiveInt(value, fallback, label) {
  if (value === undefined || value === '') return fallback;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    throw ApiError.badRequest(`"${label}" must be a positive integer`);
  }
  return num;
}

/** Standard paginated payload shape used by every list endpoint. */
function paginate({ rows, count, page, limit }) {
  const totalPages = limit > 0 ? Math.ceil(count / limit) : 0;
  return {
    data: rows,
    meta: {
      totalItems: count,
      itemsPerPage: limit,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

module.exports = { buildQueryOptions, paginate };
