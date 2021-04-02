/**
 * Replace http to https
 *
 * @param url The url string.
 */
export const securedUrl = (url: string) => url.replace('http://', 'https://')
