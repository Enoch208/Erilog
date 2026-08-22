/**
 * RFC 8785 JSON Canonicalization Scheme (JCS).
 *
 * Produces a deterministic JSON serialization with:
 * - Object keys sorted by Unicode code point (lexicographic).
 * - No insignificant whitespace.
 * - Numbers serialized per ES2022 Number.toString() (which matches RFC 8785).
 * - Strings with minimal escaping per JSON spec.
 * - Nested structures handled recursively.
 */
export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('RFC 8785: Infinity and NaN are not valid JSON values');
    }
    // ES2022 Number.toString() matches RFC 8785 number serialization
    return String(value);
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalize(item));
    return '[' + items.join(',') + ']';
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const pairs = keys
      .filter((key) => obj[key] !== undefined)
      .map((key) => JSON.stringify(key) + ':' + canonicalize(obj[key]));
    return '{' + pairs.join(',') + '}';
  }

  throw new Error(`RFC 8785: Cannot canonicalize value of type ${typeof value}`);
}
