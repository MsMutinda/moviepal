import eslint from "@eslint/js"
import nextPlugin from "@next/eslint-plugin-next"
import prettierRecommended from "eslint-plugin-prettier/recommended"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: [
      "node_modules",
      ".next",
      "dist",
      "build",
      "out",
      "next-env.d.ts",
      "drizzle",
      ".env*",
      "docs",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
    },
  },
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["./*", "../*"],
        },
      ],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  prettierRecommended,
)
