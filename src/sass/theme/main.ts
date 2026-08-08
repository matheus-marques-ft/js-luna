import { lighten, darken } from './util';

export const themes = [
  {
    name: 'default',
    color: '#483D3D',
    label: 'Default'
  },
  {
    name: 'darkGary',
    color: '#303237',
    label: 'DarkGray'
  },
  {
    name: 'deepBlue',
    color: '#1A212C',
    label: 'DarkBlue'
  }
];

export const themeColors: any = themes.reduce((acc, theme) => {
  acc[theme.name] = theme.color;
  return acc;
}, {});

// Simplified theme object
export const mainTheme = () => {
  return {
    // Global
    '--el-text-color-dark': '#000000d9',
    '--el-text-color-light': '#EFEFF0',
    // Scrollbar thumb background
    '--el-scroll-bar-thumb-bg-color': lighten(10),
    // Scrollbar track background
    '--el-scroll-bar-track-bg-color': darken(10),
    // Header tab icon color
    '--el-icon-color': '#ffffff',
    // Icon color on hover
    '--el-icon-hover-color': '#d6cbcb',
    // '--el-border-color-x': darken(30, '#000000', 0.4),
    // '--el-border-color-y': darken(30, '#000000', 0.4),
    '--el-border-color-x': 'rgba(0, 0, 0, 0.3)',
    '--el-border-color-y': 'rgba(0, 0, 0, 0.3)',

    // Header navigation background
    '--el-nav-bg-color': lighten(0),

    // Main content area background
    '--el-main-bg-color': darken(13),
    // Disconnected tab item background
    '--el-tab-deactive-bg-color': lighten(10),
    // Editor background
    '--el-editor-bg-color': darken(2),
    // Header tab item background
    '--el-tab-bg-color': darken(4),
    '--el-tab-sub-bg-color': darken(3),

    // Sidebar
    // Sidebar organization module background
    '--el-org-bg-color': darken(6),
    // Asset area background
    '--el-asset-tree-bg-color': darken(8),
    // Collapse panel item
    '--el-banner-bg-color': darken(4),
    // Icon color
    '--el-banner-icon-color': '#CCCCCC',

    // Dropdown menu or select
    '--el-dropdown-bg-color': '#000000',
    // Header navigation dropdown menu background
    '--el-dropdown-selected-bg-color': lighten(5),
    // Header navigation dropdown menu hover background
    '--el-dropdown-hover-bg-color': darken(4),
    // Dropdown menu or select selected background
    '--el-dropdown-active-bg-color': lighten(10),
    // Drawer background
    '--el-drawer-bg-color': darken(1),
    // Collapse panel background
    '--el-drawer-collapse-bg-color': darken(2),
    // Divider color
    '--el-divider-border-color': lighten(20),
    // Form hover border color
    '--el-form-hover-border-color': lighten(20),
    // Form focus border color
    '--el-form-focus-border-color': lighten(30),
    // Segmented background
    '--el-segmented-bg-color': lighten(5),
    // Segmented hover background
    '--el-segmented-hover-bg-color': lighten(10)
  };
};
