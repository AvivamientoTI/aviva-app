import { createTheme } from '@mantine/core';

export const theme = createTheme({
    /** Paleta de colores Classic Light */
    colors: {
        // Sapphire Blue (Professional & High Contrast)
        blue: [
            '#eff6ff', // 0: Background tint
            '#dbeafe', // 1: Hover tint
            '#bfdbfe', // 2: Muted borders
            '#93c5fd', // 3: Active borders
            '#60a5fa', // 4: Secondary elements
            '#3b82f6', // 5: Interaction
            '#2563eb', // 6: Primary Brand
            '#1d4ed8', // 7: Deep Primary
            '#1e40af', // 8: Hover Deep
            '#1e3a8a', // 9: Background Base (rarely used in light)
        ],
        // Neutral Slate (For professional typography)
        slate: [
            '#f8fafc', // 0
            '#f1f5f9', // 1
            '#e2e8f0', // 2
            '#cbd5e1', // 3
            '#94a3b8', // 4
            '#64748b', // 5: Medium (Previously low contrast)
            '#475569', // 6: Stronger (Good for secondary text)
            '#334155', // 7: Deep
            '#1e293b', // 8: Title
            '#0f172a', // 9: Black
        ],
        gray: [
            '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8',
            '#64748b', '#475569', '#334155', '#1e293b', '#0f172a'
        ],
    },

    primaryColor: 'blue',
    primaryShade: 6,
    defaultRadius: 'md',

    /** Tipografía Premium: Outfit para títulos, Plus Jakarta para cuerpo */
    fontFamily: '"Plus Jakarta Sans", Inter, -apple-system, sans-serif',
    headings: {
        fontFamily: '"Outfit", sans-serif',
        fontWeight: '800',
        sizes: {
            h1: { fontSize: '2.5rem', lineHeight: '1.2', letterSpacing: '-0.025em' },
            h2: { fontSize: '2rem', lineHeight: '1.3', letterSpacing: '-0.025em' },
            h3: { fontSize: '1.5rem', lineHeight: '1.4', letterSpacing: '-0.015em' },
            h4: { fontSize: '1.25rem', lineHeight: '1.45' },
        },
    },

    /** Componentes personalizados con Estética Classic Light */
    components: {
        Button: {
            defaultProps: {
                radius: 'md',
                loaderProps: { type: 'dots' },
            },
            styles: (theme) => ({
                root: {
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    transition: 'all 0.2s ease',
                    '&:active': { transform: 'scale(0.98)' },
                },
            }),
        },

        Card: {
            defaultProps: {
                shadow: 'sm',
                radius: 'lg',
                withBorder: true,
            },
            styles: (theme) => ({
                root: {
                    transition: 'all 0.2s ease',
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        borderColor: '#cbd5e1',
                    },
                },
            }),
        },

        Paper: {
            defaultProps: {
                radius: 'lg',
                shadow: 'xs',
            },
            styles: (theme) => ({
                root: {
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                }
            })
        },

        Badge: {
            defaultProps: {
                radius: 'sm',
                variant: 'light',
            },
            styles: {
                root: {
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                },
            },
        },

        Modal: {
            defaultProps: {
                radius: 'lg',
                overlayProps: {
                    backgroundOpacity: 0.4,
                    blur: 2,
                },
            },
            styles: (theme) => ({
                content: {
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                },
                header: {
                    borderBottom: '1px solid #f1f5f9',
                },
                title: {
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    color: '#0f172a',
                }
            })
        },

        AppShell: {
            styles: (theme) => ({
                header: {
                    backgroundColor: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                },
                navbar: {
                    backgroundColor: '#f8fafc',
                    borderRight: '1px solid #e2e8f0',
                }
            })
        }
    },
});
