import { createRequire } from "node:module"
import babelParser from "@babel/eslint-parser"
import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import onlyWarn from "eslint-plugin-only-warn"
import turboPlugin from "eslint-plugin-turbo"

const require = createRequire(import.meta.url)

// Design-system rule 6: logical properties only (ms/me/ps/pe/start/end, border-s, text-start),
// so layouts flip in RTL. Checked in className attributes and cn()/cva() calls.
const PHYSICAL_CLASS = [
  String.raw`(^|[\s:!])-?(m[lr]|p[lr]|left|right|scroll-m[lr]|scroll-p[lr])-`,
  String.raw`(^|[\s:!])(border|rounded)-([lr]|[tb][lr])(-|\s|$)`,
  String.raw`(^|[\s:!])(text|float|clear)-(left|right)(\s|$)`,
].join("|")
const CLASS_CONTEXT =
  ":matches(JSXAttribute[name.name='className'], CallExpression[callee.name=/^(cn|cva)$/])"
const PHYSICAL_CLASS_MESSAGE =
  "Use logical utilities (ms-/me-/ps-/pe-/start-/end-/border-s/rounded-s/text-start) so the layout flips in RTL. See docs/design-system/patterns/rtl.md."
const logicalPropertiesRule = [
  { selector: `${CLASS_CONTEXT} Literal[value=/${PHYSICAL_CLASS}/]`, message: PHYSICAL_CLASS_MESSAGE },
  { selector: `${CLASS_CONTEXT} TemplateElement[value.raw=/${PHYSICAL_CLASS}/]`, message: PHYSICAL_CLASS_MESSAGE },
]

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    // Flat config only matches *.js/*.mjs/*.cjs by default; without this, TS/TSX is never linted.
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [require.resolve("@babel/preset-typescript")],
        },
      },
    },
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      "no-restricted-syntax": ["error", ...logicalPropertiesRule],
    },
  },
  {
    // Core no-unused-vars can't see JSX usage or type-only imports; TypeScript's
    // noUnusedLocals/noUnusedParameters (typescript-config/base.json) covers this instead.
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  {
    // Babel 8's preset-typescript no longer turns on JSX for .tsx when called from ESLint.
    // Enable the parser plugin for .tsx only (in .ts it would misread `<T>value` casts).
    files: ["**/*.tsx"],
    languageOptions: {
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [require.resolve("@babel/preset-typescript")],
          parserOpts: { plugins: ["jsx"] },
        },
      },
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
]
