function getPaginationParams(query = {}, defaultLimit = 20) {
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) page = 1;

  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > 100) limit = 100; // Cap maximum limit at 100 to prevent OOM / DoS

  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function formatPaginationResponse(items, total, page, limit) {
  const pages = Math.ceil(total / limit) || 1;
  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages
    },
    // Top-level properties for additional backward and forward compatibility
    total,
    page,
    limit,
    pages
  };
}

module.exports = {
  getPaginationParams,
  formatPaginationResponse
};
