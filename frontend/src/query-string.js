const safeDecode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return null; // malformed % sequence
  }
}

export default {
  parse: function parse(queryString) {
    const query = {};
    if (!queryString) return query;
    const pairs = (queryString[0] === '?' ? queryString.substring(1) : queryString).split('&');
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i].split('=');
      const key = safeDecode(pair[0]);
      const value = safeDecode(pair[1] || '');
      if (key === null || value === null || key === '') continue; // ignore bad params
      query[key] = value;
    }
    return query;
  }
}
