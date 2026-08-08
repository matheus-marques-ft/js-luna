# Theme System

## Introduction

The theme system manages the app's color scheme, providing a simple way to define and apply themes. Each theme only defines a single main color (based on the value of `--el-main-bg-color`); every other color is generated from the main color via color-processing functions.

## Theme Structure

The theme system is made up of the following parts:

1. **Theme color definitions**: all themes' main colors are defined centrally in `themes.ts`, with the main color value sourced from the `--el-main-bg-color` value in the original config.

2. **Color-processing functions**: defined in `interface/index.ts`, including `lighten`, `darken`, `saturate`, `desaturate`, `alpha`, etc., used to generate colors of varying lightness and opacity based on the main color.

3. **Theme files**: each area has a corresponding theme file, such as `main.ts`, `menu.ts`, `header.ts`, `dropdown.ts`. Each file defines the CSS variables for that area — most colors are derived from the main color, with a few special colors using fixed values.

## Usage

### Color-processing functions

The color-processing functions accept one or two parameters:

```typescript
function lighten(amount: number, color?: string, alphaValue?: number): string;
function darken(amount: number, color?: string, alphaValue?: number): string;
function saturate(amount: number, color?: string): string;
function desaturate(amount: number, color?: string): string;
function alpha(amount: number, color?: string): string;
```

- `amount`: the degree of adjustment. For lighten and darken, a percentage (0-100); for alpha, the opacity (0-1)
- `color`: the base color (optional). If not provided, the function automatically uses the current theme's main color
- `alphaValue`: opacity value (optional, only supported by lighten and darken). Range 0-1, used to adjust brightness and opacity at the same time

### Example

```typescript
import { lighten, darken } from "./interface/index";

// Theme object
export const mainTheme = {
  // Main area background
  "--el-main-bg-color": darken(10), // automatically uses the current theme color
  // Elements with opacity
  "--el-overlay-bg-color": darken(5, undefined, 0.8), // 80% opacity
  // Main area text color
  "--el-text-color-light": "#EFEFF0",
  // Other CSS variables...
};
```

## Adding a New Theme

To add a new theme type, just add a new theme color to the `themes` object in `themes.ts`:

```typescript
// Add a new theme in themes.ts
export const themes = {
  default: "#1E1C1C",
  darkBlue: "#141618",
  newTheme: "#YOUR_COLOR", // add the new theme
};
```

Then add support for the new theme in the `switchTheme` function in `useTheme.ts`:

```typescript
const switchTheme = () => {
  if (ThemeType === "darkBlue") {
    html.setAttribute("class", "darkBlue");
  } else if (ThemeType === "newTheme") {
    // handle the new theme
    html.setAttribute("class", "newTheme");
  } else {
    html.setAttribute("class", "");
  }

  // Apply all themes
  initTheme();
};
```

## Color Adjustment Guide

When adjusting theme colors, consider the following guidelines:

1. **Choosing a main color**: the main color should be a dark shade suitable as a background, such as `#1E1C1C` (default theme) or `#141618` (darkBlue theme).

2. **Brightness adjustment**:

   - For areas that should be lighter than the main color, use the `lighten` function, e.g. `lighten(20)`
   - For areas that should be darker than the main color, use the `darken` function, e.g. `darken(10)`
   - Adjusting the `amount` parameter controls how much the brightness changes

3. **Special colors**: for certain special colors, such as text colors or accent colors, fixed color values can be used, e.g. `#EFEFF0`, `#7494f3`, etc.

## Advantages

- **Minimalist design**: each theme only needs to define a single main color, greatly simplifying theme configuration
- **Consistency**: colors across all areas are derived from the same main color, ensuring visual consistency
- **Easy to extend**: adding a new theme only requires adding one new color value, with no need to configure colors for each area individually
- **Flexibility**: color-processing functions can generate a variety of different lightness/opacity variations based on the main color
- **Close to the original design**: adjusting the color-processing functions' parameters lets generated colors stay close to the original design's colors
- **Simplified usage**: color-processing functions can now automatically retrieve the current theme color, without needing to pass it in manually

## Switching Themes

Currently, theme switching is implemented by setting a class on the HTML root element. The `switchTheme` function in `useTheme.ts` handles this logic.

If you need to add a new theme type, you can modify the `switchTheme` function to support the new theme type.
