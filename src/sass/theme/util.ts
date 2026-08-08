import { mainTheme, themeColors } from './main';

export namespace Theme {
  export type ThemeType = 'default' | 'darkBlue' | 'deepBlue' | 'chinaRed';
}

let themeTypeGetter: (() => string | null) | null = null;

export function setThemeTypeGetter(fn: () => string | null) {
  themeTypeGetter = fn;
}

function getCurrentThemeColor(): string {
  const themeType = (themeTypeGetter && themeTypeGetter()) || 'default';
  return themeColors[themeType] || themeColors.default;
}

// Color processing function: increase brightness
export function lighten(amount: number, color?: string, alphaValue?: number): string {
  // If no color is provided, use the current theme color
  const actualColor = color || getCurrentThemeColor();
  const hsl = hexToHSL(actualColor);
  const hexColor = hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + amount));

  // If an alpha parameter is provided, apply the transparency
  if (alphaValue !== undefined) {
    return alpha(alphaValue, hexColor);
  }

  return hexColor;
}

// Color processing function: decrease brightness
export function darken(amount: number, color?: string, alphaValue?: number): string {
  // If no color is provided, use the current theme color
  const actualColor = color || getCurrentThemeColor();
  const hsl = hexToHSL(actualColor);
  const hexColor = hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - amount));

  // If an alpha parameter is provided, apply the transparency
  if (alphaValue !== undefined) {
    return alpha(alphaValue, hexColor);
  }

  return hexColor;
}

// Color processing function: increase saturation
export function saturate(amount: number, color?: string): string {
  // If no color is provided, use the current theme color
  const actualColor = color || getCurrentThemeColor();
  const hsl = hexToHSL(actualColor);
  return hslToHex(hsl.h, Math.min(100, hsl.s + amount), hsl.l);
}

// Color processing function: decrease saturation
export function desaturate(amount: number, color?: string): string {
  // If no color is provided, use the current theme color
  const actualColor = color || getCurrentThemeColor();
  const hsl = hexToHSL(actualColor);
  return hslToHex(hsl.h, Math.max(0, hsl.s - amount), hsl.l);
}

// Color processing function: adjust transparency
export function alpha(alphaValue: number, color?: string): string {
  // If no color is provided, use the current theme color
  const actualColor = color || getCurrentThemeColor();
  // Ensure the alpha value is between 0-1
  const alpha = Math.max(0, Math.min(1, alphaValue));

  // Remove the # sign and handle the shorthand form
  let hex = actualColor.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(char => char + char)
      .join('');
  }

  // Parse the RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Return in rgba format
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper function: convert hex color to HSL
interface HSL {
  h: number;
  s: number;
  l: number;
}

export function hexToHSL(hex: string): HSL {
  // Remove the # sign and handle the shorthand form
  let hexValue = hex.replace(/^#/, '');
  if (hexValue.length === 3) {
    hexValue = hexValue
      .split('')
      .map(char => char + char)
      .join('');
  }

  // Parse the RGB values
  const r = parseInt(hexValue.substring(0, 2), 16) / 255;
  const g = parseInt(hexValue.substring(2, 4), 16) / 255;
  const b = parseInt(hexValue.substring(4, 6), 16) / 255;

  // Calculate the HSL values
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
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  // Convert to standard HSL format
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Helper function: convert HSL to hex color
export function hslToHex(h: number, s: number, l: number): string {
  // Convert HSL values to the 0-1 range
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    // If saturation is 0, it's gray
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
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

  // Convert to hex
  const toHex = (x: number): string => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const useTheme = () => {
  // Get the theme type
  const getThemeType = () => localStorage.getItem('themeType') || 'default';
  const html = document.documentElement as HTMLElement;

  // General method to set the theme
  const applyTheme = (theme: Record<string, string>) => {
    Object.entries(theme).forEach(([key, value]) => {
      html.style.setProperty(key, value);
    });
  };

  // Switch theme method
  const switchTheme = (theme: string) => {
    localStorage.setItem('themeType', theme);
    if (theme === 'darkBlue') {
      html.setAttribute('class', 'darkBlue');
    } else if (theme === 'deepBlue') {
      html.setAttribute('class', 'deepBlue');
    } else {
      html.setAttribute('class', '');
    }

    // Apply all themes
    initTheme();
  };

  // Initialize and set all themes
  const setMainTheme = () => applyTheme(mainTheme());

  const initTheme = () => {
    setMainTheme();
  };

  return {
    initTheme,
    setMainTheme,
    switchTheme
  };
};
