import { useCallback, type MutableRefObject } from 'react';
import { toPng } from 'html-to-image';
import { notify } from '../../../utils/notificationsHelper';

/**
 * Hook para exportar elementos del DOM a PNG con alta resolución constante,
 * inclusive en dispositivos móviles.
 */
export function useExport() {
    const exportToPng = useCallback(async (ref: MutableRefObject<HTMLElement | null>, fileName: string) => {
        if (!ref.current) {
            notify.error('No se pudo encontrar el elemento a exportar');
            return;
        }

        // Crear un contenedor temporal oculto para renderizado "off-screen"
        // Esto asegura que la exportación siempre tenga un ancho de escritorio (ej: 1200px)
        // sin importar el tamaño de la pantalla del dispositivo.
        const originalElement = ref.current;
        const clone = originalElement.cloneNode(true) as HTMLElement;
        
        // Contenedor para el clon
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = '1200px'; // Ancho de escritorio fijo para el layout
        container.style.backgroundColor = 'white';
        container.appendChild(clone);
        document.body.appendChild(container);

        try {
            notify.info('Preparando imagen de alta resolución...', 'Generando Exportación');

            // Esperar un momento para que los estilos se apliquen al clon
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await toPng(clone, {
                cacheBust: true,
                backgroundColor: 'white',
                pixelRatio: 3,
                quality: 1.0,
                style: {
                    // Asegurar que el clon sea visible y tenga dimensiones correctas para la captura
                    visibility: 'visible',
                    position: 'static',
                    width: '1200px'
                }
            });

            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            link.click();

            notify.success('Imagen exportada correctamente');
        } catch (error) {
            console.error('Error exportando imagen:', error);
            notify.error('No se pudo generar la imagen. Inténtalo de nuevo.');
        } finally {
            // Limpiar el DOM
            document.body.removeChild(container);
        }
    }, []);

    return { exportToPng };
}
