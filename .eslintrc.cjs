module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'node': true,
  },
  'extends': [
    'eslint:recommended',
    'google',
  ],
  'parserOptions': {
    'ecmaVersion': 2022,
    'sourceType': 'module',
    'ecmaFeatures': {
    },
  },
  'rules': {
    'max-len': [2, 100],
  },
};
