/**
 * Base API client using fetch.
 * All paths are relative since we are using Vite proxy for /api and /ai routes.
 */

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

export const apiClient = {
  async get(url) {
    return this.request(url, { method: 'GET' });
  },

  async post(url, body) {
    return this.request(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async delete(url) {
    return this.request(url, { method: 'DELETE' });
  },

  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new ApiError(
          response.status,
          data?.error || `Request failed with status ${response.status}`,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error(error instanceof Error ? error.message : 'Network error');
    }
  },
};
