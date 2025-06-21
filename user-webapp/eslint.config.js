import js from '@eslint/js'
import vue from 'eslint-plugin-vue'

export default [
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  ...vue.configs['flat/strongly-recommended'],
  ...vue.configs['flat/recommended'],
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      '.vscode/**',
      'coverage/**',
      '*.config.js'
    ]
  },
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Globals for browser environment
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        // Node.js globals for config files
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Vite globals
        import: 'readonly'
      }
    },
    rules: {
      // Vue 3 Composition API specific rules
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': 'off',
      
      // Vue 3 specific rules
      'vue/no-multiple-template-root': 'off', // Vue 3 allows multiple root elements
      'vue/no-v-for-template-key': 'off', // Vue 3 uses different key placement
      'vue/no-v-model-argument': 'off', // Vue 3 allows v-model arguments
      'vue/valid-v-slot': ['error', {
        allowModifiers: true
      }],
      
      // Composition API preferences
      'vue/prefer-import-from-vue': 'error',
      'vue/v-for-delimiter-style': ['error', 'in'],
      'vue/v-on-event-hyphenation': ['error', 'always'],
      'vue/attribute-hyphenation': ['error', 'always'],
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      'vue/prop-name-casing': ['error', 'camelCase'],
      
      // General JavaScript rules
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      
      // Formatting rules (handled by Prettier)
      'indent': 'off',
      'quotes': 'off',
      'semi': 'off',
      'comma-dangle': 'off',
      'max-len': 'off',

      // Linebreak style rule to avoid conflicts
      'linebreak-style': 'off' // Disables linebreak checks
    }
  },
  {
    // Specific rules for .vue files
    files: ['**/*.vue'],
    rules: {
      // Vue template specific rules
      'vue/html-indent': ['error', 2],
      'vue/html-closing-bracket-newline': ['error', {
        singleline: 'never',
        multiline: 'always'
      }],
      'vue/html-self-closing': ['error', {
        html: {
          void: 'always',
          normal: 'always',
          component: 'always'
        },
        svg: 'always',
        math: 'always'
      }],
      'vue/max-attributes-per-line': ['error', {
        singleline: 3,
        multiline: 1
      }]
    }
  },
  {
    // Specific rules for JavaScript files
    files: ['**/*.js'],
    rules: {
      'no-undef': 'error'
    }
  },
  {
    // Configuration files
    files: ['**/vite.config.js', '**/eslint.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
      }
    }
  }
]
