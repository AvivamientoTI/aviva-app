import { useCallback, type MutableRefObject } from 'react';
import { exportHelper } from '../../../utils/exportHelper';
import { notify } from '../../../utils/notificationsHelper';
import dayjs from 'dayjs';

/**
 * Hook para exportar elementos del DOM a PNG con alta resolución constante,
 * incluyendo un marco decorativo premium.
 */
export function useExport() {
    const exportToPng = useCallback(async (
        ref: MutableRefObject<HTMLElement | null>, 
        fileName: string,
        options?: { title?: string; subtitle?: string; departmentName?: string }
    ) => {
        if (!ref.current) {
            notify.error('No se pudo encontrar el elemento a exportar');
            return;
        }

        const dateLabel = dayjs().format('MMMM_YYYY');
        const cleanFileName = fileName.replace('.png', '') + `_${dateLabel}.png`;

        await exportHelper.captureAndDownload(ref.current, {
            fileName: cleanFileName,
            title: options?.title || 'Programación de Servicios',
            subtitle: options?.subtitle,
            departmentName: options?.departmentName,
            pixelRatio: 3
        });
    }, []);

    return { exportToPng };
}
