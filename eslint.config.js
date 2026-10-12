import ashNazg from 'eslint-config-ash-nazg'

export default [
  {
    ignores: [
      '.idea',
      'coverage',
      'dist'
    ]
  },
  ...ashNazg(['sauron', 'polyglot'])
];
