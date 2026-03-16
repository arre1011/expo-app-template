// Mock for victory-native
const React = require('react');

module.exports = {
  CartesianChart: ({ children }) => children ? children({
    points: { bac: [] },
    chartBounds: { left: 0, right: 300, top: 0, bottom: 200 }
  }) : null,
  Line: () => null,
  useChartPressState: () => ({
    state: {
      x: { position: { value: 0 }, value: { value: 0 } },
      y: { bac: { position: { value: 0 }, value: { value: 0 } } }
    },
    isActive: false
  }),
};
