import { createTheme } from '@mantine/core';

export const theme = createTheme({
    /** Paleta de colores Premium */
    colors: {
        // Indigo-Slate / Deep Space (Optimized for Dark Mode Contrast)
        blue: [
            '#f0f4ff', // 0: Background tint
            '#e0e7ff', // 1: Hover tint
            '#c7d2fe', // 2: Muted borders
            '#a5b4fc', // 3: Active borders
            '#818cf8', // 4: Secondary elements
            '#6366f1', // 5: Primary (Indigo 500)
            '#4f46e5', // 6: Deep Primary
            '#4338ca', // 7: Deepest Interactive
            '#3730a3', // 8: Dark Mode Card Surfaces
            '#312e81', // 9: Dark Mode Background Base
        ],
        // Sunset Orange / Accents
        orange: [
            '#fff7ed',
            '#ffedd5',
            '#fed7aa',
            '#fdba74',
            '#fb923c',
            '#f97316', // Primary Accent
            '#ea580c',
            '#c2410c',
            '#9a3412',
            '#7c2d12',
        ],
    },

    primaryColor: 'blue',
    primaryShade: { light: 6, dark: 5 },
    defaultRadius: 'lg',

    /** Tipografía Premium: Outfit para títulos, Plus Jakarta para cuerpo */
    fontFamily: '"Plus Jakarta Sans", Inter, -apple-system, sans-serif',
    headings: {
        fontFamily: '"Outfit", sans-serif',
        fontWeight: '700',
        sizes: {
            h1: { fontSize: '2.5rem', lineHeight: '1.2', letterSpacing: '-0.02em' },
            h2: { fontSize: '2rem', lineHeight: '1.3', letterSpacing: '-0.02em' },
            h3: { fontSize: '1.5rem', lineHeight: '1.4', letterSpacing: '-0.01em' },
            h4: { fontSize: '1.25rem', lineHeight: '1.45' },
        },
    },

    /** Componentes personalizados con Estética refined */
    components: {
        Button: {
            defaultProps: {
                radius: 'xl',
                loaderProps: { type: 'dots' },
            },
            styles: (theme) => ({
                root: {
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    '&:active': { transform: 'scale(0.96)' },
                    '&:hover': {
                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
                        transform: 'translateY(-1px)',
                    },
                },
            }),
        },

        Card: {
            defaultProps: {
                shadow: 'md',
                radius: 'xl',
                withBorder: true,
            },
            styles: (theme) => ({
                root: {
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.25)',
                    backgroundColor: theme.colorScheme === 'dark'
                        ? 'rgba(30, 41, 59, 0.45)'
                        : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid',
                    borderColor: theme.colorScheme === 'dark'
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                        transform: 'translateY(-6px) scale(1.005)',
                        boxShadow: theme.colorScheme === 'dark'
                            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            : '0 20px 40px rgba(0,0,0,0.08)',
                        borderColor: theme.colors.blue[4],
                    },
                },
            }),
        },

        Paper: {
            defaultProps: {
                radius: 'xl',
            },
            styles: (theme) => ({
                root: {
                    backgroundColor: theme.colorScheme === 'dark'
                        ? 'rgba(15, 23, 42, 0.6)'
                        : 'rgba(255, 255, 255, 0.9)',
                }
            })
        },

        Badge: {
            defaultProps: {
                radius: 'md',
                variant: 'light',
            },
            styles: {
                root: {
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: '0.6rem',
                },
            },
        },

        Modal: {
            defaultProps: {
                radius: '24px',
                overlayProps: {
                    backgroundOpacity: 0.55,
                    blur: 8,
                },
            },
            styles: (theme) => ({
                content: {
                    backdropFilter: 'blur(24px)',
                    backgroundColor: theme.colorScheme === 'dark'
                        ? 'rgba(15, 23, 42, 0.9)'
                        : 'rgba(255, 255, 255, 0.95)',
                    border: `1px solid ${theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                },
                header: {
                    backgroundColor: 'transparent',
                },
                title: {
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 700,
                    fontSize: '1.5rem',
                }
            })
        },

        AppShell: {
            styles: (theme) => ({
                header: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: `1px solid ${theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'}`,
                },
                navbar: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(16px)',
                    borderRight: `1px solid ${theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'}`,
                }
            })
        }
    },
});
