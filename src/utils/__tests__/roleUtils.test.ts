import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseRoles } from '../roleUtils';

describe('roleUtils > parseRoles', () => {
    beforeEach(() => vi.clearAllMocks());

    it('should identify Líder correctly (with accent)', () => {
        const result = parseRoles('Líder');
        expect(result.isLider).toBe(true);
        expect(result.isAnyLeader).toBe(true);
        expect(result.isSublider).toBe(false);
    });

    it('should identify Lider without accent', () => {
        const result = parseRoles('lider');
        expect(result.isLider).toBe(true);
    });

    it('should identify Sublíder correctly', () => {
        const result = parseRoles('Sublíder');
        expect(result.isSublider).toBe(true);
        expect(result.isAnyLeader).toBe(true);
    });

    it('should identify Encargado correctly', () => {
        const result = parseRoles('Encargado');
        expect(result.isEncargado).toBe(true);
        expect(result.isAnyLeader).toBe(false);
    });

    it('should identify Encargada correctly', () => {
        const result = parseRoles('Encargada');
        expect(result.isEncargado).toBe(true);
    });

    it('should identify Servidor correctly', () => {
        const result = parseRoles('Servidor');
        expect(result.isServidor).toBe(true);
        expect(result.isLider).toBe(false);
        expect(result.isAnyLeader).toBe(false);
    });

    it('should identify Servidora correctly', () => {
        const result = parseRoles('Servidora');
        expect(result.isServidor).toBe(true);
    });

    it('should identify Admin correctly', () => {
        const result = parseRoles('Admin');
        expect(result.isAdmin).toBe(true);
        expect(result.isAnyLeader).toBe(true);
    });

    it('should return all false for unknown role', () => {
        const result = parseRoles('UnknownRole');
        expect(result.isLider).toBe(false);
        expect(result.isSublider).toBe(false);
        expect(result.isEncargado).toBe(false);
        expect(result.isServidor).toBe(false);
        expect(result.isAdmin).toBe(false);
        expect(result.isAnyLeader).toBe(false);
    });

    it('should handle null or undefined gracefully', () => {
        expect(() => parseRoles(null)).not.toThrow();
        expect(() => parseRoles(undefined)).not.toThrow();
        const result = parseRoles(null);
        expect(result.isLider).toBe(false);
    });

    it('should be case-insensitive', () => {
        expect(parseRoles('LIDER').isLider).toBe(true);
        expect(parseRoles('ADMIN').isAdmin).toBe(true);
        expect(parseRoles('SERVIDOR').isServidor).toBe(true);
    });
});
