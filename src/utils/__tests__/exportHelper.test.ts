import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportHelper } from '../exportHelper';

// Mock html-to-image
vi.mock('html-to-image', () => ({
    toCanvas: vi.fn()
}));

// Mock dayjs
vi.mock('dayjs', () => {
    const dayjsMock: any = () => ({
        format: () => 'abril 2026'
    });
    dayjsMock.extend = vi.fn();
    return { default: dayjsMock };
});

// Mock notificationsHelper
vi.mock('../notificationsHelper', () => ({
    notify: {
        info: vi.fn(),
        success: vi.fn(),
        error: vi.fn()
    }
}));

import { toCanvas } from 'html-to-image';
import { notify } from '../notificationsHelper';

// Track elements appended during tests for safe cleanup
const appendedElements: HTMLElement[] = [];

// Helper: create a simple DOM element
const makeElement = () => {
    const el = document.createElement('div');
    el.textContent = 'Test Calendar Content';
    document.body.appendChild(el);
    appendedElements.push(el);
    return el;
};

// Helper: mock a canvas with a blob
const makeCanvasMock = (blobContent: Blob | null = new Blob(['img'], { type: 'image/jpeg' })) => ({
    toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,fake'),
    toBlob: vi.fn().mockImplementation((callback: (blob: Blob | null) => void, _type: string, _quality: number) => {
        callback(blobContent);
    })
});

describe('exportHelper > captureAndDownload', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock URL.createObjectURL & revokeObjectURL
        global.URL.createObjectURL = vi.fn().mockReturnValue('blob:fake-url');
        global.URL.revokeObjectURL = vi.fn();

        // Ensure canvas prototype is mocked and returns the mock object
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
    });

    afterEach(() => {
        // Safely remove only tracked elements instead of wiping innerHTML
        while (appendedElements.length > 0) {
            const el = appendedElements.pop()!;
            if (el.parentNode) el.parentNode.removeChild(el);
        }
        vi.restoreAllMocks();
    });

    it('should call toCanvas and trigger file download on success', async () => {
        const el = makeElement();
        const canvas = makeCanvasMock();
        (toCanvas as any).mockResolvedValue(canvas);

        await exportHelper.captureAndDownload(el, {
            fileName: 'test-report.png',
            title: 'Rol Mensual',
            departmentName: 'Servidores'
        });

        expect(toCanvas).toHaveBeenCalled();
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(notify.success).toHaveBeenCalled();
    });

    it('should convert .png fileName to .jpg', async () => {
        const el = makeElement();
        const canvas = makeCanvasMock();
        (toCanvas as any).mockResolvedValue(canvas);

        // Intercept anchor creation to check download attribute
        const originalCreate = document.createElement.bind(document);
        const anchorCalls: string[] = [];
        vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
            const elem = originalCreate(tag);
            if (tag === 'a') {
                Object.defineProperty(elem, 'download', {
                    get: () => anchorCalls[0],
                    set: (v) => anchorCalls.push(v)
                });
                elem.click = vi.fn();
            }
            return elem;
        });

        await exportHelper.captureAndDownload(el, { fileName: 'test-report.png', title: 'Test' });

        expect(anchorCalls[0]).toBe('test-report.jpg');
        vi.restoreAllMocks();
    });

    it('should call notify.info at the start of export', async () => {
        const el = makeElement();
        const canvas = makeCanvasMock();
        (toCanvas as any).mockResolvedValue(canvas);

        await exportHelper.captureAndDownload(el, { fileName: 'test.png', title: 'Test' });
        expect(notify.info).toHaveBeenCalledWith(expect.any(String), expect.any(String));
    });

    it('should call notify.error and throw when toCanvas fails', async () => {
        const el = makeElement();
        (toCanvas as any).mockRejectedValue(new Error('Canvas error'));

        await expect(
            exportHelper.captureAndDownload(el, { fileName: 'test.png', title: 'Test' })
        ).rejects.toThrow('Canvas error');

        expect(notify.error).toHaveBeenCalled();
    });

    it('should handle null blob gracefully', async () => {
        const el = makeElement();
        const canvas = makeCanvasMock(null); // null blob
        (toCanvas as any).mockResolvedValue(canvas);

        // Override prototype toBlob to simulate null blob for this test
        HTMLCanvasElement.prototype.toBlob = vi.fn((callback: (b: Blob | null) => void) => callback(null));

        const result = await exportHelper.captureAndDownload(el, { fileName: 'test.png', title: 'Test' });

        // Falls back to dataURL (doesn't throw), exact value from mocked toDataURL
        expect(typeof result).toBe('string');
        expect(notify.success).not.toHaveBeenCalled();
        expect(notify.error).toHaveBeenCalled();
    });

    it('should use custom pixelRatio when provided', async () => {
        const el = makeElement();
        const canvas = makeCanvasMock();
        (toCanvas as any).mockResolvedValue(canvas);

        await exportHelper.captureAndDownload(el, {
            fileName: 'test.png',
            title: 'Test',
            pixelRatio: 3
        });

        expect(toCanvas).toHaveBeenCalledWith(
            expect.any(HTMLElement),
            expect.objectContaining({ pixelRatio: 3 })
        );
    });
});
