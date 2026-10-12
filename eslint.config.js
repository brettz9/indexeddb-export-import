import ashNazg from 'eslint-config-ash-nazg';

export default [
  {
    ignores: [
      '.idea',
      'coverage',
      'dist'
    ]
  },
  ...ashNazg(['sauron', 'polyglot']),
  ...ashNazg(['sauron', 'node']).map((cfg) => {
    return {
      files: ['test/**/*.js', '**/*.md/*.js'],
      ...cfg
    };
  }),
  {
    files: ['**/*.md/*.js'],
    rules: {
      'no-console': 'off',
      'unicorn/no-process-exit': 'off',
      'n/no-unpublished-import': 'off'
    }
  }
];
