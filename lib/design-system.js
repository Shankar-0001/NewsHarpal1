/**
 * Design System & Theme Configuration
 * Centralized styling constants for consistent UI across app
 */

export const COLORS = {
    primary: '#2563eb', // Blue
    secondary: '#7c3aed', // Purple
    success: '#10b981', // Green
    warning: '#f59e0b', // Amber
    danger: '#ef4444', // Red
    info: '#0ea5e9', // Cyan
}

export const SPACING = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
}

export const BREAKPOINTS = {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
    ultra: '1536px',
}

export const Typography = {
    headings: {
        h1: {
            fontSize: '2.25rem', // 36px
            fontWeight: 700,
            lineHeight: '2.5rem',
            letterSpacing: '-0.02em',
        },
        h2: {
            fontSize: '1.875rem', // 30px
            fontWeight: 700,
            lineHeight: '2.25rem',
            letterSpacing: '-0.01em',
        },
        h3: {
            fontSize: '1.5rem', // 24px
            fontWeight: 600,
            lineHeight: '2rem',
            letterSpacing: '-0.005em',
        },
        h4: {
            fontSize: '1.25rem', // 20px
            fontWeight: 600,
            lineHeight: '1.75rem',
        },
        h5: {
            fontSize: '1.125rem', // 18px
            fontWeight: 500,
            lineHeight: '1.625rem',
        },
    },
    body: {
        lg: {
            fontSize: '1.125rem', // 18px
            fontWeight: 400,
            lineHeight: '1.75rem',
        },
        base: {
            fontSize: '1rem', // 16px
            fontWeight: 400,
            lineHeight: '1.5rem',
        },
        sm: {
            fontSize: '0.875rem', // 14px
            fontWeight: 400,
            lineHeight: '1.25rem',
        },
        xs: {
            fontSize: '0.75rem', // 12px
            fontWeight: 400,
            lineHeight: '1rem',
        },
    },
}

export const SHADOWS = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
}

export const BORDER_RADIUS = {
    none: '0',
    sm: '0.125rem', // 2px
    base: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
}

export const TRANSITIONS = {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
}

export const BUTTON_STYLES = {
    primary: {
        background: COLORS.primary,
        color: '#ffffff',
        hover: '#1d4ed8',
        active: '#1e40af',
    },
    secondary: {
        background: '#e5e7eb',
        color: '#111827',
        hover: '#d1d5db',
        active: '#9ca3af',
    },
    danger: {
        background: COLORS.danger,
        color: '#ffffff',
        hover: '#dc2626',
        active: '#b91c1c',
    },
    ghost: {
        background: 'transparent',
        color: '#111827',
        hover: '#f3f4f6',
        active: '#e5e7eb',
    },
}

export const CARD_STYLES = {
    padding: '1.5rem', // 24px
    borderRadius: BORDER_RADIUS.lg,
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    darkBackground: '#111827',
    darkBorder: '1px solid #374151',
}

export const FORM_STYLES = {
    inputHeight: '2.5rem', // 40px
    inputBorderRadius: BORDER_RADIUS.md,
    inputBorder: '1px solid #d1d5db',
    inputFocus: `
    outline: none;
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  `,
    labelFontSize: '0.875rem', // 14px
    labelFontWeight: 500,
    labelColor: '#374151',
}

/**
 * Common CSS classes for consistent usage
 */
export const CSS_CLASSES = {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    section: 'py-12 md:py-16 lg:py-20',
    gridResponsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    flexCenter: 'flex items-center justify-center',
    textCenter: 'text-center',
    divider: 'border-t border-gray-200 dark:border-gray-800',
    badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    link: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline',
}

/**
 * Utility function to merge design tokens
 */
export const mergeStyles = (...styles) => {
    return Object.assign({}, ...styles)
}

/**
 * Dark mode utilities
 */
export const DARK_MODE = {
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
}

export default {
    COLORS,
    SPACING,
    BREAKPOINTS,
    Typography,
    SHADOWS,
    BORDER_RADIUS,
    TRANSITIONS,
    BUTTON_STYLES,
    CARD_STYLES,
    FORM_STYLES,
    CSS_CLASSES,
    DARK_MODE,
}
