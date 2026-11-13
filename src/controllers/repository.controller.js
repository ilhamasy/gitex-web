import { RepositoryService } from '../services/repository/repository.service.js';

/**
 * Controller to validate repository URLs and detect provider
 */
export const validateUrl = (req, res) => {
  // Extract only url; never trust client-supplied provider or metadata
  const { url } = req.body || {};

  const result = RepositoryService.resolveRepository(url);

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
      apiUrl: result.apiUrl,
    },
  });
};

export default {
  validateUrl,
};
