module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    '@react-native-community'
  ],
  env: {
    'jest': true,
  },
  "rules": {
    "@typescript-eslint/explicit-member-accessibility": [
      "error",
      { "accessibility": "no-public" }
    ]
  }
};
