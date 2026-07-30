export default {
  extends: ['html-validate:recommended'],
  rules: {
    // The project uses an XHTML-compatible void-element style intentionally.
    'doctype-style': 'off',
    'void-style': 'off',
  },
};
