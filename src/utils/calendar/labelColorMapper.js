// Mapeo armónico para servicios y posiciones
export function getServiceColor(servicio) {
  if (!servicio) return 'gray';
  const s = servicio.toLowerCase();
  if (s.includes('misa')) return 'indigo';
  if (s.includes('boda')) return 'pink';
  if (s.includes('funeral')) return 'gray';
  if (s.includes('adoración')) return 'yellow';
  if (s.includes('bautizo')) return 'teal';
  if (s.includes('retiro')) return 'cyan';
  if (s.includes('rosario')) return 'grape';
  if (s.includes('vigilia')) return 'violet';
  if (s.includes('culte') || s.includes('culto')) return 'indigo';
  if (s.includes('especial')) return 'blue';
  return 'indigo'; // default armónico y profesional
}

export function getPositionColor(posicion) {
  if (!posicion) return 'gray';
  const p = posicion.toLowerCase();
  if (p.includes('coordinador')) return 'yellow';
  if (p.includes('encargado')) return '#FFD700'; // dorado profesional
  if (p.includes('lector')) return 'teal';
  if (p.includes('acólito')) return 'indigo';
  if (p.includes('servidor')) return 'blue';
  if (p.includes('musica') || p.includes('música')) return 'grape';
  if (p.includes('puerta')) return 'orange';
  return 'blue'; // default
}
