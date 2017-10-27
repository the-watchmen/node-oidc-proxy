module.exports = {
  extends: ['eslint:recommended', 'prettier'],
  parser: 'babel-eslint',
  env: {
    es6: true,
    browser: true
  },
  ecmaFeatures: {
    modules: true,
    jsx: true
  },
  globals: {
    __DEV__: true
  },
  plugins: ['prettier'],
  rules: {
    'unicorn/no-abusive-eslint-disable': 'off',
    // 'import/no-unresolved': 'off',
    'import/no-unassigned-import': 'off',
    'import/prefer-default-export': 'off',
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: false,
        bracketSpacing: false,
        printWidth: 100
      }
    ]
  }
}
