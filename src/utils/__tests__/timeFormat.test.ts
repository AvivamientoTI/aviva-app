import { describe, it, expect } from 'vitest';
import { formatTime12h } from '../timeFormat';

describe('formatTime12h', () => {
    it('converts morning hour correctly', () => {
        expect(formatTime12h('08:30')).toBe('8:30 AM');
    });

    it('converts noon to 12:00 PM', () => {
        expect(formatTime12h('12:00')).toBe('12:00 PM');
    });

    it('converts midnight to 12:00 AM', () => {
        expect(formatTime12h('00:00')).toBe('12:00 AM');
    });

    it('converts afternoon hour correctly', () => {
        expect(formatTime12h('13:45')).toBe('1:45 PM');
    });

    it('converts 23:59 correctly', () => {
        expect(formatTime12h('23:59')).toBe('11:59 PM');
    });

    it('handles HH:MM:SS by ignoring seconds', () => {
        expect(formatTime12h('09:15:00')).toBe('9:15 AM');
    });

    it('returns empty string for null', () => {
        expect(formatTime12h(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(formatTime12h(undefined)).toBe('');
    });

    it('returns empty string for empty string', () => {
        expect(formatTime12h('')).toBe('');
    });
});
