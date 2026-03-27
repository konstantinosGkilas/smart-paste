import tsParser from "@typescript-eslint/parser";
import obsidianmd from "eslint-plugin-obsidianmd";

export default [
	...obsidianmd.configs.recommended,
	{
		files: ["**/*.ts"],
		ignores: ["node_modules/**", "tests/**"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
				project: "./tsconfig.json",
			},
		},
		rules: {
			"no-restricted-properties": [
				"error",
				{
					property: "innerHTML",
					message: "Use DOM API or Obsidian helpers instead of innerHTML.",
				},
				{
					property: "outerHTML",
					message: "Use DOM API or Obsidian helpers instead of outerHTML.",
				},
				{
					property: "insertAdjacentHTML",
					message: "Use DOM API or Obsidian helpers instead of insertAdjacentHTML.",
				},
			],
			"no-restricted-globals": [
				"error",
				{
					name: "setTimeout",
					message: "Use window.setTimeout instead of bare setTimeout.",
				},
				{
					name: "setInterval",
					message: "Use window.setInterval instead of bare setInterval.",
				},
			],
			"no-console": ["error", { allow: ["warn", "error"] }],
			"no-eval": "error",
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_" },
			],
			"@typescript-eslint/unbound-method": "off",
			"prefer-const": "error",
			"no-var": "error",
		},
	},
];
