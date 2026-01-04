/**
 * Mapea nombres de colores de uniforme a colores de Mantine Badge
 */
export const getUniformeColor = (uniforme) => {
  if (!uniforme || uniforme === 'N/A') return 'gray';

  const uniformeLower = uniforme.toLowerCase();

  // Array of rules to ensure priority order
  // Specific colors should come before generic ones if needed
  const COLOR_RULES = [
    { keywords: ['vino', 'wine', 'burgundy'], color: '#800020' },
    { keywords: ['roja', 'rojo', 'red'], color: 'red' },
    { keywords: ['azul', 'blue', 'indigo'], color: 'indigo' },
    { keywords: ['verde', 'green'], color: 'green' }, // Use green or teal
    { keywords: ['negro', 'negra', 'black'], color: 'dark' },
    { keywords: ['blanco', 'blanca', 'white'], color: 'gray' },
    { keywords: ['amarillo', 'amarilla', 'yellow'], color: 'yellow' },
    { keywords: ['naranja', 'orange'], color: 'orange' },
    { keywords: ['morado', 'morada', 'violetab', 'violet', 'purple'], color: 'violet' },
    { keywords: ['rosa', 'pink'], color: 'pink' },
    { keywords: ['gris', 'gray', 'silver'], color: 'gray' },
    { keywords: ['café', 'cafe', 'marrón', 'brown'], color: 'brown' },
    { keywords: ['beige', 'crema'], color: '#d4a574' },
    // Remove generic 'camisa' matching that might override specific colors
  ];

  for (const rule of COLOR_RULES) {
    if (rule.keywords.some(k => uniformeLower.includes(k))) {
      return rule.color;
    }
  }

  return 'gray'; // Default fallback
};

/**
 * Constantes de colores de uniforme
 */
export const UNIFORM_COLORS = {
  VINO: '#800020',
  AZUL: 'indigo',
  ROJO: 'red',
  VERDE: 'teal',
  NEGRO: 'dark',
  BLANCO: 'gray',
  AMARILLO: 'yellow',
  NARANJA: 'orange',
  MORADO: 'violet',
  ROSA: 'pink',
  GRIS: 'gray',
  CAFE: 'brown'
};
