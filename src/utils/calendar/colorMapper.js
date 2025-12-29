/**
 * Mapea nombres de colores de uniforme a colores de Mantine Badge
 */
export const getUniformeColor = (uniforme) => {
  if (!uniforme || uniforme === 'N/A') return 'gray';

  const uniformeLower = uniforme.toLowerCase();

  const colorMap = {
    vino: '#800020',
    wine: '#800020',
    burgundy: '#800020',
    roja: 'red',
    rojas: 'red',
    rojo: 'red',
    rojos: 'red',
    azul: 'indigo',
    azules: 'indigo',
    blue: 'indigo',
    verdes: 'teal',
    verde: 'teal',
    green: 'teal',
    negro: 'dark',
    negra: 'dark',
    negros: 'dark',
    negras: 'dark',
    black: 'dark',
    blanco: 'gray',
    blanca: 'gray',
    blancos: 'gray',
    blancas: 'gray',
    white: 'gray',
    amarillo: 'yellow',
    amarilla: 'yellow',
    amarillos: 'yellow',
    amarillas: 'yellow',
    yellow: 'yellow',
    naranja: 'orange',
    naranjas: 'orange',
    orange: 'orange',
    morado: 'violet',
    morada: 'violet',
    morados: 'violet',
    moradas: 'violet',
    purple: 'violet',
    violeta: 'violet',
    violetas: 'violet',
    rosa: 'pink',
    rosas: 'pink',
    pink: 'pink',
    gris: 'gray',
    grises: 'gray',
    gray: 'gray',
    café: 'brown',
    cafes: 'brown',
    marrón: 'brown',
    marrones: 'brown',
    brown: 'brown',
    beige: '#d4a574',
    camisa: '#d4a574'
  };

  for (const [key, value] of Object.entries(colorMap)) {
    if (uniformeLower.includes(key)) return value;
  }

  return 'grape';
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
