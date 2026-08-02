/**
 * Genera archivos ICS para sincronizar los servicios del servidor
 * con Google Calendar, Outlook, Apple Calendar e iOS.
 */
import dayjs from 'dayjs';

interface ServiceEvent {
    fecha: string;           // YYYY-MM-DD
    posicion: string;
    departamento?: string;
    tipoServicio?: string;
    uniforme?: string;
}

/** Genera un UUID v4 simple para los UID de los eventos ICS */
function uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

/** Formatea fecha en formato ICS: YYYYMMDD */
function icsDate(date: string): string {
    return dayjs(date).format('YYYYMMDD');
}

/** Genera el contenido ICS para múltiples servicios */
export function generateICS(events: ServiceEvent[], serverName: string): string {
    const now = dayjs().format('YYYYMMDDTHHmmss');

    const vEvents = events.map(ev => {
        const dtStart = icsDate(ev.fecha);
        const dtEnd = icsDate(dayjs(ev.fecha).add(1, 'day').format('YYYY-MM-DD'));
        const summary = ev.posicion
            ? `Servicio: ${ev.posicion}`
            : 'Servicio en Aviva';
        const description = [
            serverName && `Servidor: ${serverName}`,
            ev.tipoServicio && `Tipo: ${ev.tipoServicio}`,
            ev.uniforme && `Uniforme: ${ev.uniforme}`,
            ev.departamento && `Departamento: ${ev.departamento}`,
        ].filter(Boolean).join('\\n');

        return [
            'BEGIN:VEVENT',
            `UID:${uuid()}@aviva-app`,
            `DTSTAMP:${now}Z`,
            `DTSTART;VALUE=DATE:${dtStart}`,
            `DTEND;VALUE=DATE:${dtEnd}`,
            `SUMMARY:${summary}`,
            description ? `DESCRIPTION:${description}` : '',
            'STATUS:CONFIRMED',
            'END:VEVENT',
        ].filter(Boolean).join('\r\n');
    }).join('\r\n');

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Aviva App//Rol de Servicios//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        vEvents,
        'END:VCALENDAR',
    ].join('\r\n');
}

/** Descarga el archivo ICS en el dispositivo del usuario */
export function downloadICS(events: ServiceEvent[], serverName: string, fileName = 'mis-servicios.ics') {
    const content = generateICS(events, serverName);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 200);
}

/** Genera un enlace de Google Calendar para UN evento */
export function googleCalendarUrl(ev: ServiceEvent): string {
    const base = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const dates = `${icsDate(ev.fecha)}/${icsDate(dayjs(ev.fecha).add(1, 'day').format('YYYY-MM-DD'))}`;
    const text = encodeURIComponent(ev.posicion ? `Servicio: ${ev.posicion}` : 'Servicio en Aviva');
    const details = encodeURIComponent([
        ev.tipoServicio && `Tipo: ${ev.tipoServicio}`,
        ev.uniforme && `Uniforme: ${ev.uniforme}`,
    ].filter(Boolean).join('\n'));
    return `${base}&text=${text}&dates=${dates}&details=${details}&sf=true&output=xml`;
}

/** Genera un enlace de Outlook Web para UN evento */
export function outlookCalendarUrl(ev: ServiceEvent): string {
    const base = 'https://outlook.live.com/calendar/0/deeplink/compose';
    const startdt = encodeURIComponent(`${ev.fecha}T00:00:00`);
    const enddt   = encodeURIComponent(`${dayjs(ev.fecha).add(1, 'day').format('YYYY-MM-DD')}T00:00:00`);
    const subject = encodeURIComponent(ev.posicion ? `Servicio: ${ev.posicion}` : 'Servicio en Aviva');
    const body    = encodeURIComponent([
        ev.tipoServicio && `Tipo: ${ev.tipoServicio}`,
        ev.uniforme && `Uniforme: ${ev.uniforme}`,
    ].filter(Boolean).join('\n'));
    return `${base}?path=/calendar/action/compose&rru=addevent&startdt=${startdt}&enddt=${enddt}&subject=${subject}&body=${body}&allday=true`;
}
