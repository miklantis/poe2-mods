// Die @fontsource-variable-Pakete liefern nur CSS als Side-Effect-Import und
// keine eigenen Typdeklarationen. Da tsconfig `noUncheckedSideEffectImports`
// aktiviert, deklarieren wir die Module hier als reine Side-Effect-Module.
declare module '@fontsource-variable/*'
