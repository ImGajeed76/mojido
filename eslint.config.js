import tseslint from "typescript-eslint";
import sveltePlugin from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/build/**",
      "**/dist/**",
      "**/.svelte-kit/**",
      "**/bin/**",
      "axogen.ts",
    ],
  },

  {
    files: ["**/*.js", "**/*.ts", "**/*.svelte"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  {
    files: ["**/*.ts"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  {
    files: ["**/*.svelte"],
    extends: [...sveltePlugin.configs.recommended],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  prettier
);
