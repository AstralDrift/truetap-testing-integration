/**
 * Enhanced Jest Configuration for React Native Solana Payment App
 * 
 * Optimized for:
 * - Legacy and new architecture testing
 * - Device compatibility testing
 * - Performance monitoring
 * - Accessibility testing
 */

module.exports = {
  preset: 'react-native',
  
  // Test file patterns - includes both legacy and new architecture
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/modelFront/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx|js)',
  ],

  // Module name mapping for assets and path aliases
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/modelFront/$1',
    '^@/components/(.*)$': '<rootDir>/modelFront/components/$1',
    '^@/lib/(.*)$': '<rootDir>/modelFront/lib/$1',
    '^@/types$': '<rootDir>/modelFront/types/index.ts',
    '^src/(.*)$': '<rootDir>/src/$1',
  },

  // Test environment
  testEnvironment: 'node',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/setup.ts',
    '<rootDir>/__tests__/utils/enhanced-test-setup.ts',
  ],
  
  setupFiles: [
    './__tests__/mocks/react-native-hce.ts',
    './__tests__/utils/global-test-setup.ts',
  ],

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { 
      presets: ['@react-native/babel-preset'],
      plugins: [
        ['@babel/plugin-transform-private-methods', { loose: true }],
      ],
    }],
  },

  // Transform ignore patterns - allow testing of React Native modules
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-ble-plx|react-native-reanimated|framer-motion|@solana-mobile)/)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    'modelFront/**/*.{ts,tsx,js,jsx}',
    '!**/__tests__/**',
    '!**/*.test.{ts,tsx,js,jsx}',
    '!**/*.spec.{ts,tsx,js,jsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.d.ts',
    '!**/index.{ts,tsx,js,jsx}', // Exclude barrel exports
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Specific thresholds for critical modules
    'src/services/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'modelFront/components/features/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Test execution configuration
  testTimeout: 15000, // Increased for integration tests
  maxWorkers: 1, // Maintain single worker for stability
  forceExit: true,
  detectOpenHandles: true,
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',

  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  // Test result configuration
  verbose: true,
  errorOnDeprecated: true,

  // Test file organization
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/coverage/',
  ],

  // Custom test environments for different test types
  projects: [
    // Unit tests configuration
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/modelFront/__tests__/components/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
      ],
      testTimeout: 10000,
    },

    // Integration tests configuration
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/__tests__/integration/**/*.test.(ts|tsx)',
        '<rootDir>/modelFront/__tests__/integration/**/*.test.(ts|tsx)',
      ],
      testTimeout: 20000,
    },

    // Accessibility tests configuration
    {
      displayName: 'accessibility',
      testMatch: [
        '<rootDir>/__tests__/accessibility/**/*.test.(ts|tsx)',
        '<rootDir>/modelFront/__tests__/accessibility/**/*.test.(ts|tsx)',
      ],
      setupFilesAfterEnv: [
        '<rootDir>/__tests__/setup.ts',
        '<rootDir>/__tests__/utils/accessibility-setup.ts',
      ],
    },

    // Performance tests configuration
    {
      displayName: 'performance',
      testMatch: [
        '<rootDir>/__tests__/performance/**/*.test.(ts|tsx)',
        '<rootDir>/modelFront/__tests__/performance/**/*.test.(ts|tsx)',
      ],
      testTimeout: 30000,
    },
  ],

  // Global test configuration
  globals: {
    __DEV__: true,
    __TEST__: true,
  },

  // Test reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results',
        outputName: 'junit.xml',
        suiteName: 'True Tap Test Suite',
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/test-results/html-report',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
      },
    ],
  ],

  // Watch mode configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Module directories for resolution
  moduleDirectories: ['node_modules', '<rootDir>/src', '<rootDir>/modelFront'],

  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Snapshot configuration
  snapshotSerializers: ['@testing-library/jest-native/serializer'],

  // Custom matchers
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/setup.ts',
    '@testing-library/jest-native/extend-expect',
  ],
}