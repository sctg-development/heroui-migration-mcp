import js from "@eslint/js";
import ts from "typescript-eslint";

export default [
    {
        ignores: [
            "node_modules",
            "dist",
            ".git",
            "coverage",
            "build",
            ".next",
            "tmp*",
            "data/generated",
            ".cache",
            "vitest.config.ts",
            "tests/**",
            "eslint.config.ts",
        ],
    },
    js.configs.recommended,
    ...ts.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: ts.parser,
            parserOptions: {
                ecmaVersion: 2024,
                sourceType: "module",
                project: "./tsconfig.json",
            },
        },
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-function-return-types": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "no-console": "off",
            "prefer-const": "error",
            "no-fallthrough": "off",
            "no-empty": "off",
            "no-irregular-whitespace": "off",
            "no-prototype-builtins": "off",
        },
    },
    {
        files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: "module",
        },
        rules: {
            "no-console": "off",
            "prefer-const": "error",
        },
    },
    {
        files: ["tests/**", "**/*.test.ts", "**/*.spec.ts"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
        },
    },
];
