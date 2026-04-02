module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/features/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/setup.ts'],
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
        }],
      },
    },
    {
      displayName: 'ui',
      preset: 'react-native',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/**/*.test.tsx'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^react-native-confetti-cannon$': '<rootDir>/__mocks__/react-native-confetti-cannon.js',
        '^victory-native$': '<rootDir>/__mocks__/victory-native.js',
        '^@shopify/react-native-skia$': '<rootDir>/__mocks__/@shopify/react-native-skia.js',
        '^@gorhom/bottom-sheet$': '<rootDir>/__mocks__/@gorhom/bottom-sheet.js',
      },
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-confetti-cannon))',
      ],
    },
  ],
};
