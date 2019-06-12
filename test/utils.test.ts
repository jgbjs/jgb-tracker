import { safeGet } from '../src/utils';

const obj = {
  a: {
    b: '1',
    c: [2],
    d: [{ e: 2 }]
  }
};

describe('safeGet', () => {
  test('a.b', () => {
    const result = safeGet(obj, 'a.b');
    expect(result).toBe('1');
  });

  test(`a['b']`, () => {
    const result = safeGet(obj, `a['b']`);
    expect(result).toBe('1');
  });

  test(`a['c'][0]`, () => {
    const result = safeGet(obj, `a['c'][0]`);
    expect(result).toBe(2);
  });

  test(`a.d[0]["e"]`, () => {
    const result = safeGet(obj, `a.d[0]["e"]`);
    expect(result).toBe(2);
  });

  test(`a.e.f tobe undefined`, () => {
    const result = safeGet(obj, `a.e.f`);
    expect(result).toBeUndefined();
  });
});
