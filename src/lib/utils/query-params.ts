/**
 * Utility functions for managing URL query parameters
 */

/**
 * Get a query parameter value from the current URL
 */
export function getQueryParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

/**
 * Set a query parameter in the URL without triggering a navigation
 */
export function setQueryParam(key: string, value: string | null): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);

  if (value === null || value === '') {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(key, value);
  }

  // Update URL without triggering a navigation or reload
  window.history.replaceState({}, '', url.toString());
}

/**
 * Get multiple query parameters as an object
 */
export function getQueryParams(keys: string[]): Record<string, string | null> {
  if (typeof window === 'undefined') {
    return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {});
  }

  const params = new URLSearchParams(window.location.search);
  return keys.reduce((acc, key) => ({
    ...acc,
    [key]: params.get(key),
  }), {});
}

/**
 * Set multiple query parameters at once
 */
export function setQueryParams(params: Record<string, string | null>): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });

  window.history.replaceState({}, '', url.toString());
}

/**
 * Create a reactive store for a query parameter
 * Returns current value and a setter function
 */
export function createQueryParamStore(key: string, defaultValue: string = '') {
  let currentValue = getQueryParam(key) ?? defaultValue;

  return {
    get value() {
      return currentValue;
    },
    set(newValue: string | null) {
      currentValue = newValue ?? defaultValue;
      setQueryParam(key, newValue);
    },
  };
}
