/**
 * Health check controller
 */
export const getHealth = (req, res) => {
  const healthData = {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'gitex-web',
    version: '1.0.0',
  };

  res.status(200).json(healthData);
};

export default {
  getHealth,
};
