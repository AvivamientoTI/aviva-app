import { useCallback, type MutableRefObject } from 'react';
import { toPng } from 'html-to-image';
import { notifications } from '@mantine/notifications';

/**
 * Hook para exportar elementos del DOM a PNG
 */
export function useExport() {
    const exportToPng = useCallback(async (ref: MutableRefObject<HTMLElement | null>, fileName: string) => {
        if (!ref.current) {
            notifications.show({
                title: 'Error',
                message: 'No se pudo encontrar el elemento a exportar',
                color: 'red'
            });
            return;
        }

        try {
            const dataUrl = await toPng(ref.current, {
                cacheBust: true,
                backgroundColor: 'white',
                pixelRatio: 3,
                quality: 1.0,
                skipFonts: false
            });

            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            link.click();

            notifications.show({
                title: 'Éxito',
                message: 'Imagen exportada correctamente',
                color: 'green'
            });
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error',
                message: 'Error exportando imagen',
                color: 'red'
            });
        }
    }, []);

    return { exportToPng };
}
