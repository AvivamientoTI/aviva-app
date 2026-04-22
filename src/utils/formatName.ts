export function formatName(nombre: string | null | undefined, apellido: string | null | undefined): string {
    if (!nombre && !apellido) return 'Sin Asignar';
    const firstNombre = nombre ? nombre.trim().split(' ')[0] : '';
    const firstApellido = apellido ? apellido.trim().split(' ')[0] : '';
    return `${firstNombre} ${firstApellido}`.trim();
}
