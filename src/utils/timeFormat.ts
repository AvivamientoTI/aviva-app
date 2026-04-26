/**
 * Converts a 24-hour time string (HH:MM or HH:MM:SS) to 12-hour format.
 * e.g. "08:30" → "8:30 AM", "13:00" → "1:00 PM", "00:00" → "12:00 AM"
 */
export function formatTime12h(time: string | null | undefined): string {
    if (!time) return '';
    const [hStr, mStr] = time.slice(0, 5).split(':');
    const h = parseInt(hStr, 10);
    const m = mStr ?? '00';
    const period = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${period}`;
}
