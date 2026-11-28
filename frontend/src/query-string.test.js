import queryString from './query-string';

describe('query-string parse', () => {
  it('parses normal params', () => {
    expect(queryString.parse('?a=1&b=two%20words')).toEqual({ a: '1', b: 'two words' });
  });

  it('does not throw on a malformed % sequence and ignores that param', () => {
    expect(() => queryString.parse('?a=%E0%A4%A&b=2')).not.toThrow();
    expect(queryString.parse('?a=%E0%A4%A&b=2')).toEqual({ b: '2' });
    expect(queryString.parse('?%=1&c=3')).toEqual({ c: '3' });
  });

  it('handles empty input', () => {
    expect(queryString.parse('')).toEqual({});
  });
});
