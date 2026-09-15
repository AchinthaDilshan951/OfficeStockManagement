import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  // ============================================
  // IGNORE GENERATED / EXTERNAL FILES
  // ============================================
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "backend/node_modules/**",
      "database/**",
      "lint-output.txt",
    ],
  },

  // ============================================
  // FRONTEND - REACT
  // ============================================
  {
    files: ["src/**/*.{js,jsx}"],

    languageOptions: {
      globals: globals.browser,

      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",

        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    rules: {
      ...js.configs.recommended.rules,

      "react/jsx-uses-vars": "error",

      "react-hooks/rules-of-hooks": "error",

      "react-hooks/exhaustive-deps": "off",

      "react-hooks/set-state-in-effect": "off",

      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
    },
  },

  // ============================================
  // VITE CONFIG
  // ============================================
  {
    files: ["vite.config.js"],

    languageOptions: {
      globals: globals.node,

      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },

    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // ============================================
  // BACKEND - NODE / EXPRESS
  // ============================================
  {
    files: ["backend/**/*.js"],

    languageOptions: {
      globals: globals.node,

      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "commonjs",
      },
    },

    rules: {
      ...js.configs.recommended.rules,

      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^next$",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];