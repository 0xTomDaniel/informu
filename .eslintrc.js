module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    "react-hooks"
  ],
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
    ],
    "@typescript-eslint/no-explicit-any": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
};
