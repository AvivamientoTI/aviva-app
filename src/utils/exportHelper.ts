import { toCanvas } from 'html-to-image';
import dayjs from 'dayjs';
import { notify } from './notificationsHelper';

interface ExportOptions {
    fileName: string;
    title: string;
    subtitle?: string;
    departmentName?: string;
    pixelRatio?: number;
}

// Detecta si el dispositivo es móvil para ajustar pixelRatio y timeout
const isMobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;

export const exportHelper = {
    captureAndDownload: async (element: HTMLElement, options: ExportOptions) => {
        const {
            fileName: originalFileName,
            title,
            subtitle,
            departmentName,
            pixelRatio,
        } = options;

        // En móviles limitar siempre a 1.5 para evitar errores de memoria,
        // independientemente del pixelRatio solicitado
        const devicePixelRatio = isMobile() ? Math.min(pixelRatio ?? 1.5, 1.5) : (pixelRatio ?? 2);

        const fileName = originalFileName.replace('.png', '.jpg');

        try {
            notify.info('Iniciando exportación de alta calidad...', 'Procesando Reporte');

            // 1. Crear el Marco Premium
            const wrapper = document.createElement('div');
            wrapper.id = 'export-capture-wrapper';

            // CLAVE: position fixed fuera del viewport visible (top negativo),
            // con opacity: 1 y z-index alto para que el navegador sí lo renderice.
            // Evitar z-index negativo o opacity cercana a 0 — causa imágenes en blanco.
            wrapper.style.cssText = `
                position: fixed;
                top: -9999px;
                left: 0;
                width: 1200px;
                z-index: 99999;
                opacity: 1;
                pointer-events: none;
                background-color: #ffffff;
                padding: 40px;
                display: flex;
                flex-direction: column;
                gap: 20px;
                border-radius: 0;
                box-sizing: border-box;
            `;

            // 2. Encabezado Premium con Borde Dorado
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 25px;
                background-color: #fff;
                border-radius: 16px;
                border: 1px solid #e2e8f0;
                border-left: 8px solid #d97706;
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            const info = document.createElement('div');

            const t = document.createElement('h1');
            t.innerText = title.toUpperCase();
            t.style.cssText = `
                margin: 0;
                font-size: 24px;
                font-weight: 900;
                color: #0f172a;
                letter-spacing: -0.02em;
            `;

            const s = document.createElement('div');
            s.innerText = `${departmentName ? departmentName + ' | ' : ''}${subtitle || dayjs().format('MMMM YYYY')}`;
            s.style.cssText = `
                font-size: 14px;
                font-weight: 700;
                color: #64748b;
                text-transform: uppercase;
                margin-top: 4px;
            `;

            info.appendChild(t);
            info.appendChild(s);

            const brand = document.createElement('div');
            brand.innerText = 'UJIERES APP';
            brand.style.cssText = `
                font-weight: 900;
                font-size: 18px;
                color: #d97706;
                letter-spacing: 0.1em;
            `;

            header.appendChild(info);
            header.appendChild(brand);

            // 3. Contenedor del contenido
            const contentContainer = document.createElement('div');
            contentContainer.style.cssText = `
                background-color: white;
                border-radius: 16px;
                overflow: visible;
            `;

            // Clonar el elemento original
            const clone = element.cloneNode(true) as HTMLElement;
            clone.style.cssText += `
                width: 100%;
                transform: none;
                position: static;
                visibility: visible;
                display: block;
                opacity: 1;
            `;

            contentContainer.appendChild(clone);

            // 4. Pie de Página
            const footer = document.createElement('div');
            footer.style.cssText = `
                text-align: center;
                padding: 20px;
                font-size: 11px;
                color: #94a3b8;
                font-weight: 600;
            `;
            footer.innerText = `REPORTE OFICIAL • GENERADO EL ${dayjs().format('DD/MM/YYYY HH:mm')} • © UJIERES APP SYSTEM`;

            wrapper.appendChild(header);
            wrapper.appendChild(contentContainer);
            wrapper.appendChild(footer);

            // Inyectar en document.body para evitar restricciones de overflow del contenedor padre
            document.body.appendChild(wrapper);

            // 5. Esperar renderizado — más tiempo en móviles
            const renderDelay = isMobile() ? 1200 : 800;
            await new Promise(resolve => setTimeout(resolve, renderDelay));

            // 6. Captura vía Canvas
            const canvas = await toCanvas(wrapper, {
                pixelRatio: devicePixelRatio,
                backgroundColor: '#ffffff',
                skipFonts: true, // Evita errores CORS de fuentes en móviles
            });

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

            // Limpiar wrapper inmediatamente
            if (wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }

            // 7. Descarga como BLOB (más compatible en móviles)
            return new Promise<string>((resolve) => {
                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        notify.error('Error al procesar la imagen final.');
                        resolve(dataUrl);
                        return;
                    }

                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = downloadUrl;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();

                    setTimeout(() => {
                        URL.revokeObjectURL(downloadUrl);
                        document.body.removeChild(a);
                    }, 100);

                    notify.success('Reporte generado con nitidez premium', '¡Éxito!');
                    resolve(dataUrl);
                }, 'image/jpeg', 0.9);
            });

        } catch (error: any) {
            console.error('CRITICAL EXPORT ERROR:', error);
            notify.error('Error al generar el reporte. Intenta cerrar otras pestañas e intentarlo de nuevo.', 'Error de Captura');
            const w = document.getElementById('export-capture-wrapper');
            if (w) w.remove();
            throw error;
        }
    }
};
