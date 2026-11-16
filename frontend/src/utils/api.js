/**
 * Base URL for API requests.
 * In development, defaults to "" (relying on Vite's local proxy).
 * In production (e.g. Firebase Hosting -> Render backend), configured via VITE_API_URL.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

/**
 * Returns full URL for an API endpoint path.
 */
export const apiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

/**
 * Safely extracts a meaningful error message from a fetch Response object.
 * Prevents JSON parsing crashes when servers or proxies return HTML error pages (e.g., 502/503/404).
 */
export async function getErrorMessage(response, defaultMsg = 'An unexpected server error occurred.') {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (data && data.detail) {
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.detail)) {
          return data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
        }
        return JSON.stringify(data.detail);
      }
      if (data && data.message) return data.message;
    } else {
      const text = await response.text();
      if (text.includes('<html') || text.includes('<!DOCTYPE')) {
        const statusText = response.statusText ? ` ${response.statusText}` : '';
        return `Backend service unavailable (HTTP ${response.status}${statusText}). Please verify backend is running.`;
      }
      if (text.trim()) {
        return text.trim().slice(0, 300);
      }
    }
  } catch {
    // fallback if stream reading or parsing fails
  }
  return `Server error (HTTP ${response.status}: ${response.statusText || defaultMsg})`;
}

/**
 * Safely parses JSON response and checks content-type to avoid syntax errors on HTML responses.
 */
export async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (text.includes('<html') || text.includes('<!DOCTYPE')) {
      throw new Error(`Backend service unavailable (HTTP ${response.status}). Expected JSON response but received HTML.`);
    }
    throw new Error(`Unexpected server response format (HTTP ${response.status}).`);
  }
  return await response.json();
}
