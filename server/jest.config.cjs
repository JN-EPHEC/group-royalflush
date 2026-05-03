/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
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
