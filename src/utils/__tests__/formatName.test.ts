import { describe, it, expect } from 'vitest';
import { formatName } from '../formatName';

describe('formatName', () => {
    it('returns first nombre + first apellido', () => {
        expect(formatName('Juan Carlos', 'Pérez García')).toBe('Juan Pérez');
    });

    it('handles single-word nombre and apellido', () => {
        expect(formatName('Ana', 'López')).toBe('Ana López');
    });

    it('returns "Sin Asignar" when both are null', () => {
        expect(formatName(null, null)).toBe('Sin Asignar');
    });

    it('returns "Sin Asignar" when both are undefined', () => {
        expect(formatName(undefined, undefined)).toBe('Sin Asignar');
    });

    it('returns nombre only when apellido is null', () => {
        expect(formatName('María', null)).toBe('María');
    });

    it('returns apellido only when nombre is null', () => {
        expect(formatName(null, 'García')).toBe('García');
    });

    it('trims leading/trailing spaces', () => {
        expect(formatName('  Juan  ', '  Pérez  ')).toBe('Juan Pérez');
    });

    it('handles empty strings as absent', () => {
        expect(formatName('', '')).toBe('Sin Asignar');
    });
});
