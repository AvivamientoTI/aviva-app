import { createTheme } from '@mantine/core';

export const theme = createTheme({
    /** Paleta de colores profesional */
    colors: {
        // Azul profesional como color primario
        blue: [
            '#f0f9ff',
            '#e0f2fe',
            '#bae6fd',
            '#7dd3fc',
            '#38bdf8',
            '#0ea5e9', // Primary 500
            '#0284c7',
            '#0369a1',
            '#075985',
            '#0c4a6e',
        ],
    },

    primaryColor: 'blue',

    /** Tipografía moderna */
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontFamilyMonospace: 'Monaco, Courier, monospace',
    headings: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
        fontWeight: '600',
        sizes: {
            h1: { fontSize: '2.125rem', lineHeight: '1.3' },
            h2: { fontSize: '1.625rem', lineHeight: '1.35' },
            h3: { fontSize: '1.375rem', lineHeight: '1.4' },
            h4: { fontSize: '1.125rem', lineHeight: '1.45' },
        },
    },

    /** Espaciado generoso */
    spacing: {
        xs: '0.625rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.25rem',
        xl: '1.5rem',
    },

    /** Bordes redondeados */
    radius: {
        xs: '0.25rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
    },

    /** Sombras sutiles */
    shadows: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    },

    /** Componentes personalizados */
    components: {
        Button: {
            defaultProps: {
                radius: 'md',
            },
            styles: {
                root: {
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                },
            },
        },

        Card: {
            defaultProps: {
                shadow: 'sm',
                radius: 'md',
                withBorder: true,
            },
            styles: {
                root: {
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    },
                },
            },
        },

        Paper: {
            defaultProps: {
                radius: 'md',
            },
        },

        Modal: {
            defaultProps: {
                radius: 'md',
                overlayProps: {
                    backgroundOpacity: 0.55,
                    blur: 3,
                },
            },
        },

        Badge: {
            defaultProps: {
                radius: 'sm',
            },
            styles: {
                root: {
                    fontWeight: 500,
                    textTransform: 'none',
                },
            },
        },

        Alert: {
            defaultProps: {
                radius: 'md',
            },
        },

        Notification: {
            defaultProps: {
                radius: 'md',
            },
        },

        Stepper: {
            styles: {
                stepIcon: {
                    borderWidth: 2,
                },
                separator: {
                    height: 2,
                },
            },
        },

        TextInput: {
            defaultProps: {
                radius: 'md',
            },
        },

        Select: {
            defaultProps: {
                radius: 'md',
            },
        },

        DatePickerInput: {
            defaultProps: {
                radius: 'md',
            },
        },
    },
});
