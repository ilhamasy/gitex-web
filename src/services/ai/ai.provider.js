/**
 * Base abstract AI Provider interface.
 * Any AI provider (Gemini, Claude, OpenAI, etc.) must implement this contract.
 */
export class AIProvider {
  constructor(name) {
    if (new.target === AIProvider) {
      throw new TypeError('Cannot construct AIProvider instances directly');
    }
    this.name = name;
  }

  /**
   * Generate text or structured content from a prompt.
   *
   * @param {string} prompt - User or system prompt
   * @param {object} options - Generation options (schema, temperature, timeout)
   * @returns {Promise<{ content: string, model: string, raw?: any }>}
   */
  async generate(prompt, options = {}) {
    throw new Error('generate() method must be implemented by concrete provider');
  }

  /**
   * Verify provider connectivity and API key validity.
   *
   * @returns {Promise<{ ok: boolean, message?: string }>}
   */
  async testConnection() {
    throw new Error('testConnection() method must be implemented by concrete provider');
  }

  /**
   * Helper to safely mask API keys for diagnostics without leaking secrets.
   */
  static maskKey(key) {
    if (!key || typeof key !== 'string') return '[NOT_SET]';
    if (key.length <= 8) return '****';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }
}

export default AIProvider;
