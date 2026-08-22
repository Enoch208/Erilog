import { describe, it, expect } from 'vitest';
import { canonicalize } from '../src/canonicalize.js';

describe('RFC 8785 Canonicalization', () => {
  describe('primitives', () => {
    it('serializes null', () => {
      expect(canonicalize(null)).toBe('null');
    });

    it('serializes booleans', () => {
      expect(canonicalize(true)).toBe('true');
      expect(canonicalize(false)).toBe('false');
    });

    it('serializes integers', () => {
      expect(canonicalize(0)).toBe('0');
      expect(canonicalize(1)).toBe('1');
      expect(canonicalize(-1)).toBe('-1');
      expect(canonicalize(42)).toBe('42');
    });

    it('serializes floats per ES Number.toString()', () => {
      expect(canonicalize(1.5)).toBe('1.5');
      expect(canonicalize(0.1)).toBe('0.1');
      expect(canonicalize(1e20)).toBe('100000000000000000000');
      expect(canonicalize(1e21)).toBe('1e+21');
    });

    it('rejects Infinity and NaN', () => {
      expect(() => canonicalize(Infinity)).toThrow();
      expect(() => canonicalize(NaN)).toThrow();
      expect(() => canonicalize(-Infinity)).toThrow();
    });

    it('serializes strings with escaping', () => {
      expect(canonicalize('hello')).toBe('"hello"');
      expect(canonicalize('')).toBe('""');
      expect(canonicalize('a"b')).toBe('"a\\"b"');
      expect(canonicalize('a\nb')).toBe('"a\\nb"');
      expect(canonicalize('a\tb')).toBe('"a\\tb"');
    });
  });

  describe('arrays', () => {
    it('serializes empty array', () => {
      expect(canonicalize([])).toBe('[]');
    });

    it('serializes array with mixed types', () => {
      expect(canonicalize([1, 'two', true, null])).toBe('[1,"two",true,null]');
    });

    it('serializes nested arrays', () => {
      expect(canonicalize([[1, 2], [3]])).toBe('[[1,2],[3]]');
    });
  });

  describe('objects — key ordering', () => {
    it('sorts keys lexicographically', () => {
      expect(canonicalize({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    });

    it('sorts keys by Unicode code point', () => {
      // Numbers come before uppercase letters come before lowercase in ASCII/Unicode
      expect(canonicalize({ z: 1, a: 2, m: 3 })).toBe('{"a":2,"m":3,"z":1}');
    });

    it('handles nested objects', () => {
      const input = { b: { d: 4, c: 3 }, a: 1 };
      expect(canonicalize(input)).toBe('{"a":1,"b":{"c":3,"d":4}}');
    });

    it('omits undefined values', () => {
      expect(canonicalize({ a: 1, b: undefined, c: 3 })).toBe('{"a":1,"c":3}');
    });

    it('serializes empty object', () => {
      expect(canonicalize({})).toBe('{}');
    });
  });

  describe('RFC 8785 specific test vectors', () => {
    // From RFC 8785 Section 3.2.4
    it('handles number edge cases', () => {
      expect(canonicalize(0)).toBe('0');
      expect(canonicalize(-0)).toBe('0'); // -0 → "0" per ES2022
      expect(canonicalize(1)).toBe('1');
      expect(canonicalize(-1)).toBe('-1');
      expect(canonicalize(0.000001)).toBe('0.000001');
      expect(canonicalize(1e-7)).toBe('1e-7');
      expect(canonicalize(1e-6)).toBe('0.000001');
    });

    it('produces no whitespace', () => {
      const result = canonicalize({ key1: 'value1', key2: [1, 2, 3] });
      expect(result).not.toContain(' ');
      expect(result).not.toContain('\n');
      expect(result).not.toContain('\t');
    });

    it('deterministic for event-like object', () => {
      const event = {
        id: 'e0e0e0e0-0000-4000-8000-000000000001',
        missionId: 'a1b2c3d4-0000-4000-8000-000000000001',
        deviceId: 'a1b2c3d4-0000-4000-8000-aaa000000001',
        policyVersion: 0,
        sequence: 0,
        tokenHash: 'a'.repeat(64),
        itemType: 'emergency_kit',
        quantity: 1,
        deviceTime: '2026-08-22T10:00:00.000Z',
        previousHash: 'GENESIS',
      };

      // Keys should be in alphabetical order
      const result = canonicalize(event);
      const parsed = JSON.parse(result);
      const keys = Object.keys(parsed);
      expect(keys).toEqual([...keys].sort());

      // Same input always produces same output
      expect(canonicalize(event)).toBe(canonicalize(event));

      // Different key insertion order, same output
      const reordered = {
        quantity: 1,
        id: 'e0e0e0e0-0000-4000-8000-000000000001',
        previousHash: 'GENESIS',
        sequence: 0,
        deviceId: 'a1b2c3d4-0000-4000-8000-aaa000000001',
        tokenHash: 'a'.repeat(64),
        missionId: 'a1b2c3d4-0000-4000-8000-000000000001',
        deviceTime: '2026-08-22T10:00:00.000Z',
        policyVersion: 0,
        itemType: 'emergency_kit',
      };
      expect(canonicalize(reordered)).toBe(canonicalize(event));
    });
  });
});
