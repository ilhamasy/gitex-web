import { validateRepositoryUrl } from '../validators/url.validator.js';

/**
 * Controller to validate repository URLs and detect provider
 */
export const validateUrl = (req, res) => {
  const { url } = req.body || {};

  const result = validateRepositoryUrl(url);

  if (!result.valid) {
    return res.status(400).json({
      success: false,
      error: result.error,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      provider: result.provider,
      owner: result.owner,
      name: result.name,
      fullName: result.fullName,
      normalizedUrl: result.normalizedUrl,
    },
  });
};

export default {
  validateUrl,
};
