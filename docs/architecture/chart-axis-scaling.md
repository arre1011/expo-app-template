# Chart Axis Scaling

## Overview

This document describes the approach for scaling chart axes in the BAC visualization charts.

## Heckbert's Nice Numbers Algorithm

We use **Heckbert's Nice Numbers Algorithm** for Y-axis scaling to produce clean, human-readable tick values.

### Why Nice Numbers?

Without this algorithm, a chart with peak BAC of 1.07‰ would show awkward values like:
- 0.0, 0.27, 0.54, 0.81, 1.07

With Nice Numbers, it displays cleaner values:
- 0.0, 0.5, 1.0, 1.5

### Algorithm

The algorithm uses "nice" numbers (1, 2, 5) × 10^n:

```typescript
function niceNumber(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);

  let niceFraction: number;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
}

function calculateNiceScale(minValue: number, maxValue: number, maxTicks: number = 5) {
  const range = niceNumber(maxValue - minValue, false);
  const tickSpacing = niceNumber(range / (maxTicks - 1), true);
  const niceMin = Math.floor(minValue / tickSpacing) * tickSpacing;
  const niceMax = Math.ceil(maxValue / tickSpacing) * tickSpacing;

  return { niceMin, niceMax, tickSpacing };
}
```

### Current Implementation

- **BACChart.tsx** (SVG-based): Uses Nice Numbers algorithm
- **BACChartVictory.tsx**: Uses Victory Native's built-in axis scaling

### Future Work

When improving the Victory Native chart, apply the Nice Numbers algorithm to:
1. Calculate a "nice" Y-axis maximum (e.g., 1.5‰ instead of 1.07‰)
2. Generate evenly-spaced tick values
3. Add time padding (30min before/after session) for visual clarity

### Reference

- Original paper: Paul Heckbert, "Nice Numbers for Graph Labels", Graphics Gems, 1990
- Used by D3.js and many charting libraries
