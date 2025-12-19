/**
 * Mapea nombres de colores de uniforme a colores de Mantine Badge
 */
export const getUniformeColor = (uniforme) => {
  if (!uniforme || uniforme === 'N/A') return 'gray';
  
  const uniformeLower = uniforme.toLowerCase();
  
  const colorMap = {
    vino: 'red',
    wine: 'red',
    burgundy: 'red',
    azul: 'blue',
    blue: 'blue',
    rojo: 'red',
    red: 'red',
    verde: 'green',
    green: 'green',
    negro: 'dark',
    black: 'dark',
    blanco: 'gray',
    white: 'gray',
    amarillo: 'yellow',
    yellow: 'yellow',
    naranja: 'orange',
    orange: 'orange',
    morado: 'grape',
    purple: 'grape',
    violeta: 'grape',
    rosa: 'pink',
    pink: 'pink',
    gris: 'gray',
    gray: 'gray',
    café: 'orange',
    marrón: 'orange',
    brown: 'orange'
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
  VINO: 'red',
  AZUL: 'blue',
  ROJO: 'red',
  VERDE: 'green',
  NEGRO: 'dark',
  BLANCO: 'gray',
  AMARILLO: 'yellow',
  NARANJA: 'orange',
  MORADO: 'grape',
  ROSA: 'pink',
  GRIS: 'gray',
  CAFE: 'orange'
};
