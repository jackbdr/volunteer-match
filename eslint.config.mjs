import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
          overrides: {
            accessors: 'explicit',
            constructors: 'explicit',
            methods: 'explicit',
            properties: 'explicit',
            parameterProperties: 'explicit'
        }
      }
      ],
      
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],
      'no-unused-vars': 'off',
      
      'no-unreachable': 'error',
      'no-unused-expressions': 'error',
      'no-unused-labels': 'error',
      
      'no-duplicate-imports': 'error',
      
      '@typescript-eslint/no-empty-interface': [
        'error',
        {
          allowSingleExtends: false
        }
      ]
    }
  }
]);

export default eslintConfig;
