/**
 * Repository URL validator and normalizer
 * Enforces SSRF protection, provider allowlisting (GitHub & GitLab),
 * and repository path structure.
 */

const ALLOWED_HOSTS = {
  'github.com': 'github',
  'www.github.com': 'github',
  'gitlab.com': 'gitlab',
  'www.gitlab.com': 'gitlab',
};

// Reserved paths on GitHub / GitLab that are not user repositories
const RESERVED_NAMESPACES = new Set([
  'explore',
  'trending',
  'topics',
  'collections',
  'events',
  'pricing',
  'features',
  'marketplace',
  'login',
  'signup',
  'join',
  'session',
  'dashboard',
  'settings',
  'help',
  'about',
  'contact',
  'security',
  'blog',
  'organizations',
  'users',
]);

const VALID_NAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

export function validateRepositoryUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return {
      valid: false,
      error: 'Repository URL is required.',
    };
  }

  const raw = inputUrl.trim();
  if (!raw) {
    return {
      valid: false,
      error: 'Repository URL cannot be empty.',
    };
  }

  // Prepend https:// only if no scheme is specified
  let urlString = raw;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return {
      valid: false,
      error: 'Malformed URL. Please enter a valid URL (e.g., https://github.com/owner/repo).',
    };
  }

  // Enforce HTTPS or HTTP (prevent javascript:, file:, data:, etc.)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return {
      valid: false,
      error: 'Only HTTP and HTTPS protocols are supported.',
    };
  }

  // Disallow user credentials in URL (e.g. user:pass@host)
  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: 'Credentials are not allowed in the repository URL.',
    };
  }

  // Prevent port-based SSRF probes
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return {
      valid: false,
      error: 'Non-standard port numbers are not permitted.',
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const provider = ALLOWED_HOSTS[hostname];

  if (!provider) {
    return {
      valid: false,
      error: 'Only public GitHub (github.com) and GitLab (gitlab.com) repositories are supported.',
    };
  }

  // Parse path segments
  const pathParts = parsed.pathname
    .split('/')
    .filter((segment) => segment.length > 0);

  if (pathParts.length < 2) {
    return {
      valid: false,
      error: 'Invalid repository path. A repository owner/group and repository name are required.',
    };
  }

  const owner = pathParts[0];
  let repoName = pathParts[1];

  // Strip .git extension if present
  if (repoName.endsWith('.git')) {
    repoName = repoName.slice(0, -4);
  }

  // Check reserved namespaces
  if (RESERVED_NAMESPACES.has(owner.toLowerCase())) {
    return {
      valid: false,
      error: `'${owner}' is a reserved portal path, not a user or organization repository.`,
    };
  }

  // Validate format of owner and repoName
  if (!VALID_NAME_REGEX.test(owner) || !VALID_NAME_REGEX.test(repoName)) {
    return {
      valid: false,
      error: 'Repository owner and name contain invalid characters.',
    };
  }

  // For GitLab, handle nested groups: /group/subgroup/project
  let fullName = `${owner}/${repoName}`;
  if (provider === 'gitlab' && pathParts.length > 2 && pathParts[2] !== '-' && pathParts[2] !== 'tree') {
    // If there's a subgroup before '-' (GitLab routing marker)
    const validSegments = [];
    for (const part of pathParts) {
      if (part === '-' || part === 'tree' || part === 'blob') break;
      const cleanPart = part.endsWith('.git') ? part.slice(0, -4) : part;
      if (!VALID_NAME_REGEX.test(cleanPart)) break;
      validSegments.push(cleanPart);
    }
    if (validSegments.length >= 2) {
      fullName = validSegments.join('/');
      repoName = validSegments[validSegments.length - 1];
    }
  }

  const canonicalHostname = provider === 'github' ? 'github.com' : 'gitlab.com';
  const normalizedUrl = `https://${canonicalHostname}/${fullName}`;

  return {
    valid: true,
    provider,
    owner,
    name: repoName,
    fullName,
    normalizedUrl,
  };
}

export default {
  validateRepositoryUrl,
};
