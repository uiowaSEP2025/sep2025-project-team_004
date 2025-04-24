export const ensureHttps = (url: string): string => {
  if (!url) return url;
  return url.replace(/^http:/, 'https:');
}; 