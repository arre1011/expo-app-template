// Mock for @shopify/react-native-skia
const React = require('react');

module.exports = {
  Circle: () => null,
  Text: () => null,
  useFont: () => null,
  Skia: {
    Color: jest.fn(),
  },
};
