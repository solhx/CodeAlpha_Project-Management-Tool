// backend/src/utils/paginate.js
export const paginate = async (Model, filter = {}, options = {}) => {
  const {
    page     = 1,
    limit    = 20,
    sort     = { createdAt: -1 },
    populate = [],
    select   = '',
  } = options;

  const skip = (page - 1) * limit;

  let query = Model.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  if (select)                  query = query.select(select);
  if (populate.length)         query = query.populate(populate);

  const [docs, total] = await Promise.all([
    query.lean(),
    Model.countDocuments(filter),
  ]);

  return {
    docs,
    pagination: {
      total,
      page:    Number(page),
      limit:   Number(limit),
      pages:   Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};