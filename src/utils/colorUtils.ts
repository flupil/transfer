/**
 * Color utility functions for dynamic color generation
 */

interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * Convert hex color to HSL
 */
export const hexToHSL = (hex: string): HSL => {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

/**
 * Convert HSL to hex color
 */
export const hslToHex = (hsl: HSL): string => {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Clamp a value between min and max
 */
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Generate 3 harmonious colors for pie charts from primary color
 * Returns colors optimized for carbs, protein, and fat
 */
export const generatePieChartColors = (primaryColor: string) => {
  const hsl = hexToHSL(primaryColor);

  // Adaptive adjustments based on color properties
  const isLight = hsl.l > 70;
  const isDark = hsl.l < 30;
  const isDesaturated = hsl.s < 40;

  // Adaptive lightness step
  const lightnessStep = isLight ? -20 : isDark ? +30 : +18;

  // Adaptive saturation step
  const saturationStep = isDesaturated ? +20 : -8;

  return {
    // Carbs - Base primary color
    carbs: primaryColor,

    // Protein - Lightened version with slight hue shift
    protein: hslToHex({
      h: (hsl.h + 35) % 360, // Shift hue for variety
      s: clamp(hsl.s + saturationStep, 35, 95),
      l: clamp(hsl.l + lightnessStep, 25, 88),
    }),

    // Fat - Different lightness, smaller hue shift
    fat: hslToHex({
      h: (hsl.h + 18) % 360, // Smaller hue shift
      s: clamp(hsl.s + (saturationStep / 2), 40, 90),
      l: clamp(hsl.l + (lightnessStep * 0.65), 30, 85),
    }),
  };
};

/**
 * Generate legend dot colors (same as pie chart but can be customized)
 */
export const generateLegendColors = (primaryColor: string) => {
  return generatePieChartColors(primaryColor);
};
