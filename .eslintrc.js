module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    "react-hooks"
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "@react-native-community", // Enforces Prettier through ESLint
    "prettier", // eslint-config-prettier
    "prettier/@typescript-eslint",
    "prettier/flowtype",
    "prettier/react"
  ],
  env: {
    'jest': true,
  },
  rules: {
    "@typescript-eslint/explicit-member-accessibility": [
      "error",
      { "accessibility": "no-public" }
    ],
    "@typescript-eslint/no-explicit-any": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-dupe-class-members": "off"
  }
};
