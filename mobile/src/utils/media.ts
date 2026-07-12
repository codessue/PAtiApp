// The API returns relative media paths (e.g. "/uploads/cats/x.png"). The app
// needs an absolute URL to load them, built from the API origin (base URL minus
// the trailing "/api"). Absolute/local URIs (http, file, content, data) pass
// through unchanged.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const mediaUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (/^(https?:|file:|content:|data:)/.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
};
