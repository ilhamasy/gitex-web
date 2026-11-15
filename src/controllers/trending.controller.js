import { TrendingService } from '../services/repository/trending.service.js';

/**
 * Controller to serve GitHub trending repositories.
 * GET /api/repository/trending?period=today|week|month
 */
export const getTrendingRepositories = async (req, res) => {
  const period = (req.query.period || 'today').toLowerCase();

  try {
    const repos = await TrendingService.getTrendingRepositories(period);

    return res.status(200).json({
      success: true,
      period: ['today', 'week', 'month'].includes(period) ? period : 'today',
      count: repos.length,
      data: repos,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve trending repositories.',
      details: err.message,
    });
  }
};

export default {
  getTrendingRepositories,
};
