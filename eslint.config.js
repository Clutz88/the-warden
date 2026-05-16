import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: {
        // Browser
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        confirm: "readonly",
        alert: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        clearTimeout: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        MouseEvent: "readonly",
        KeyboardEvent: "readonly",
        Event: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLTextAreaElement: "readonly",
        HTMLSelectElement: "readonly",
        HTMLOptionElement: "readonly",
        HTMLButtonElement: "readonly",
        Element: "readonly",
        Node: "readonly",
        ParentNode: "readonly",
        Audio: "readonly",
        Image: "readonly",
        AudioContext: "readonly",
        OscillatorNode: "readonly",
        GainNode: "readonly",
        BroadcastChannel: "readonly",
        structuredClone: "readonly",
        // Node / build-time
        process: "readonly",
        console: "readonly",
      },
    },
    rules: {
      // The TS compiler already enforces unused-vars via noUnusedLocals/noUnusedParameters,
      // but the eslint rule covers a few extra cases (catch params, destructuring).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // We use `as` casts for JSON imports — intentional, not lint-worthy.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      // Allow empty catch blocks (we use them for localStorage swallow-failures).
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
];
