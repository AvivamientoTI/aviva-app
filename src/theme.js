import { createTheme } from '@mantine/core';

export const theme = createTheme({
    /** Paleta de colores Gold Premium */
    colors: {
        // Custom Gold Palette (Matches Login)
        gold: [
            '#fffbeb', // 0: Background tint (Amber 50)
            '#fef3c7', // 1: Hover tint (Amber 100)
            '#fde68a', // 2: Muted borders
            '#fcd34d', // 3: Active borders
            '#fbbf24', // 4: Secondary elements
            '#f59e0b', // 5: Interaction
            '#d97706', // 6: Primary Brand (Amber 600)
            '#b45309', // 7: Deep Primary (matched to login button #ca8a04 roughly)
            '#92400e', // 8: Hover Deep
            '#78350f', // 9: Text Base
        ],
        // Warm Neutral Stone (Matches Login Text)
        stone: [
            '#fafaf9', // 0
            '#f5f5f4', // 1
            '#e7e5e4', // 2
            '#d6d3d1', // 3
            '#a8a29e', // 4
            '#78716c', // 5: Medium
            '#57534e', // 6: Stronger
            '#44403c', // 7: Deep
            '#292524', // 8: Title
            '#1c1917', // 9: Black/Warm Dark
        ],
        // Alias for compatibility if needed, but we prefer 'stone' for gray
        gray: [
            '#fafaf9', '#f5f5f4', '#e7e5e4', '#d6d3d1', '#a8a29e',
            '#78716c', '#57534e', '#44403c', '#292524', '#1c1917'
        ],
    },

    primaryColor: 'gold',
    primaryShade: 6,
    defaultRadius: 'md',

    /** Tipografía de Alta Fidelidad */
    fontFamily: '"Inter", sans-serif',
    headings: {
        fontFamily: '"Inter", sans-serif',
        fontWeight: '700',
        sizes: {
            // Ratios: H1/H2 = 1.31, H2/H3 = 1.31, H3/H4 = 1.33 — all ≥ 1.25
            h1: { fontSize: '2.75rem', lineHeight: '1.15', letterSpacing: '-0.024em' },
            h2: { fontSize: '2.1rem',  lineHeight: '1.25', letterSpacing: '-0.02em'  },
            h3: { fontSize: '1.6rem',  lineHeight: '1.3',  letterSpacing: '-0.015em' },
            h4: { fontSize: '1.2rem',  lineHeight: '1.4',  letterSpacing: '-0.01em'  },
        },
    },

    /** Componentes personalizados con Estética Gold Premium */
    components: {
        Button: {
            defaultProps: {
                radius: 'xl', // More rounded for premium feel
                loaderProps: { type: 'dots' },
            },
            styles: (theme) => ({
                root: {
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 200ms cubic-bezier(0.23, 1, 0.32, 1)',
                    '&:active': { transform: 'scale(0.97)' },
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    border: 'none',
                    color: 'white',
                    boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
                        boxShadow: '0 10px 15px -3px rgba(217, 119, 6, 0.3)',
                    }
                },
            }),
            vars: (theme, props) => {
                if (props.variant === 'light') {
                    return {
                        root: {
                            background: 'transparent',
                            backgroundColor: '#fffbeb', // gold[0]
                            color: '#78350f', // gold[9] for max contrast
                            boxShadow: 'none',
                            '&:hover': { backgroundColor: '#fef3c7' } // gold[1]
                        }
                    };
                }
                if (props.variant === 'outline' || props.variant === 'subtle') {
                    return { root: { background: undefined, boxShadow: 'none', color: '#78350f' } };
                }
                return { root: {} };
            }
        },

        Card: {
            defaultProps: {
                shadow: 'sm',
                radius: 'lg',
                withBorder: true,
            },
            styles: (theme) => ({
                root: {
                    transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 200ms cubic-bezier(0.23, 1, 0.32, 1)',
                    backgroundColor: 'var(--mantine-color-body)',
                    borderColor: 'var(--mantine-color-default-border)',
                    '@media (hover: hover) and (pointer: fine)': {
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 10px 20px -5px rgba(217, 119, 6, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        },
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
                    backgroundColor: 'var(--mantine-color-body)',
                    border: '1px solid var(--mantine-color-default-border)',
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
                    backgroundColor: 'var(--mantine-color-body)',
                    border: '1px solid var(--mantine-color-default-border)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                },
                header: {
                    borderBottom: '1px solid var(--mantine-color-default-border)',
                },
                title: {
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '1.4rem',
                    color: 'var(--mantine-color-text)',
                }
            })
        },

        AppShell: {
            styles: (theme) => ({
                header: {
                    backgroundColor: 'var(--mantine-color-body)',
                    borderBottom: '1px solid var(--mantine-color-default-border)',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                },
                navbar: {
                    backgroundColor: 'var(--mantine-color-body)',
                    borderRight: '1px solid var(--mantine-color-default-border)',
                },
                main: {
                    backgroundColor: 'var(--mantine-glass-bg, var(--mantine-color-body))',
                    backgroundImage: 'radial-gradient(circle at top right, var(--mantine-color-gold-0), transparent)',
                }
            })
        }
    },
});
