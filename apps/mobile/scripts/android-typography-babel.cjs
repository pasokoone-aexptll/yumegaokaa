const path = require('node:path');
// Redirect only this app's Android Text primitives; iOS and third-party code stay unchanged.
module.exports = function ({ types: t }) {
  return { visitor: { ImportDeclaration(p, state) {
    const file = state.filename || '';
    if (!file.includes(`${path.sep}src${path.sep}`) || file.endsWith('AndroidTypography.tsx') ||
        p.node.source.value !== 'react-native' || p.node.importKind === 'type') return;
    const selected = p.node.specifiers.filter(s => t.isImportSpecifier(s) &&
      s.importKind !== 'type' && ['Text', 'TextInput'].includes(s.imported.name));
    if (!selected.length) return;
    p.node.specifiers = p.node.specifiers.filter(s => !selected.includes(s));
    p.insertAfter(t.importDeclaration(selected, t.stringLiteral(path.resolve(__dirname, '../src/components/AndroidTypography'))));
    if (!p.node.specifiers.length) p.remove();
  } } };
};
