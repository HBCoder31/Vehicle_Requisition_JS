const dummyChain = new Proxy(function() {}, {
  get: function(target, prop) {
    if (prop === 'validate') return function(data) { return { value: data, error: null }; };
    return dummyChain;
  },
  apply: function() {
    return dummyChain;
  }
});

const JoiMock = new Proxy({}, {
  get: function(target, prop) {
    if (prop === 'object') return function() { return dummyChain; };
    return function() { return dummyChain; };
  }
});

module.exports = JoiMock;
