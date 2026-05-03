/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  // Ne pas exécuter les tests compilés dans dist/ (doublons + couverture faussée)
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  // Imports TypeScript avec suffixe .js (requis par Node ESM) : Jest résout vers les .ts
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
};
