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

/**
 * Controller to fetch repository metadata and README
 */
export const getRepositoryMetadata = async (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Repository URL is required.',
    });
  }

  try {
    const data = await RepositoryService.fetchMetadataAndReadme(url);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message,
      provider: err.provider || null,
    });
  }
};

export default {
  validateUrl,
  getRepositoryMetadata,
};
