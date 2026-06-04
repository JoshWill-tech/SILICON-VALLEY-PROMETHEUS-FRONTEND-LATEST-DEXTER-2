import next from "eslint-config-next";

const config = [
  ...next,
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: ["app/**/*.tsx", "components/**/*.tsx", "hooks/**/*.ts"],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ 
          name: '@/lib/crypto/token-vault', 
          message: 'Token vault is server-only. Never import in frontend code.' 
        }]
      }]
    }
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
    ],
  },
];

export default config;
