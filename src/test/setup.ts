import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock de Supabase
vi.mock('../services/supabaseClient', () => ({
    supabase: {
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
        })),
        auth: {
            getSession: vi.fn(),
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } },
            })),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
        },
    },
}));

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: any) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { }, // Deprecated
        removeListener: () => { }, // Deprecated
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
});

// Mock de Canvas para JSDOM
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillStyle: '',
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    textAlign: '',
    textBaseline: '',
    font: '',
}) as any;

HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,');
HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => callback(new Blob()));

// Mock de URL.createObjectURL y revokeObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
global.URL.revokeObjectURL = vi.fn();
