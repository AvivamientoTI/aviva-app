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

/**
 * ESTRATEGIA DEFINITIVA PARA MÓVILES (ROBUSTA Y DE ALTA CALIDAD)
 * 1. Evita clones inestables (causa de imágenes en blanco).
 * 2. Usa Blobs en lugar de DataURLs (soluciona error de tamaño en Mayo).
 * 3. Renderiza en una capa "viva" para asegurar herencia de estilos de Mantine.
 */
export const exportHelper = {
    captureAndDownload: async (element: HTMLElement, options: ExportOptions) => {
        const { 
            fileName: originalFileName, 
            title, 
            subtitle, 
            departmentName, 
            pixelRatio = 2 
        } = options;

        const fileName = originalFileName.replace('.png', '.jpg');

        try {
            notify.info('Iniciando exportación de alta calidad...', 'Procesando Reporte');

            // 1. Crear el Marco Premium (Fondo y Contenedor)
            const wrapper = document.createElement('div');
            wrapper.id = 'export-capture-wrapper';
            // Estilos de Posicionamiento (Capa Viva)
            wrapper.style.position = 'fixed';
            wrapper.style.left = '0';
            wrapper.style.top = '0';
            wrapper.style.width = '1200px'; 
            wrapper.style.zIndex = '-9999';
            wrapper.style.opacity = '0.01';
            wrapper.style.pointerEvents = 'none';
            
            // Estilos Visuales Premium
            wrapper.style.backgroundColor = '#ffffff';
            wrapper.style.padding = '40px';
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.gap = '20px';
            wrapper.style.borderRadius = '0';

            // 2. Encabezado Premium con Borde Dorado
            const header = document.createElement('div');
            header.style.padding = '25px';
            header.style.backgroundColor = '#fff';
            header.style.borderRadius = '16px';
            header.style.border = '1px solid #e2e8f0';
            header.style.borderLeft = '8px solid #d97706'; // Borde dorado distintivo
            header.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';

            const info = document.createElement('div');
            const t = document.createElement('h1');
            t.innerText = title.toUpperCase();
            t.style.margin = '0';
            t.style.fontSize = '24px';
            t.style.fontWeight = '900';
            t.style.color = '#0f172a';
            t.style.letterSpacing = '-0.02em';

            const s = document.createElement('div');
            s.innerText = `${departmentName ? departmentName + ' | ' : ''}${subtitle || dayjs().format('MMMM YYYY')}`;
            s.style.fontSize = '14px';
            s.style.fontWeight = '700';
            s.style.color = '#64748b';
            s.style.textTransform = 'uppercase';
            s.style.marginTop = '4px';

            info.appendChild(t);
            info.appendChild(s);

            const brand = document.createElement('div');
            brand.innerText = 'UJIERES APP';
            brand.style.fontWeight = '900';
            brand.style.fontSize = '18px';
            brand.style.color = '#d97706';
            brand.style.letterSpacing = '0.1em';

            header.appendChild(info);
            header.appendChild(brand);

            // 3. Contenedor del Contenido (Evitar recortes)
            const contentContainer = document.createElement('div');
            contentContainer.style.backgroundColor = 'white';
            contentContainer.style.borderRadius = '16px';
            contentContainer.style.overflow = 'hidden';

            // CLONAR CON PRECAUCIÓN
            const clone = element.cloneNode(true) as HTMLElement;
            clone.style.width = '100%';
            clone.style.transform = 'none';
            clone.style.position = 'static';
            clone.style.visibility = 'visible';
            clone.style.display = 'block';

            contentContainer.appendChild(clone);

            // 4. Pie de Página Elegante
            const footer = document.createElement('div');
            footer.style.textAlign = 'center';
            footer.style.padding = '20px';
            footer.style.fontSize = '11px';
            footer.style.color = '#94a3b8';
            footer.style.fontWeight = '600';
            footer.innerText = `REPORTE OFICIAL • GENERADO EL ${dayjs().format('DD/MM/YYYY HH:MM')} • © UJIERES APP SYSTEM`;

            // Ensamblar en el DOM real para heredar estilos globales
            wrapper.appendChild(header);
            wrapper.appendChild(contentContainer);
            wrapper.appendChild(footer);
            
            // Inyectar cerca del elemento original para asegurar contexto CSS
            element.parentElement?.appendChild(wrapper);

            // 5. Esperar Renderizado (Esencial para móviles)
            await new Promise(resolve => setTimeout(resolve, 800));

            // 6. Captura vía Canvas + Blob (Máxima compatibilidad)
            const canvas = await toCanvas(wrapper, {
                pixelRatio,
                backgroundColor: '#ffffff',
                skipFonts: false, 
            });

            // Generar DataURL para retornar (compatibilidad con jsPDF)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

            // Limpiar el wrapper inmediatamente después de pasar a canvas
            if (wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }

            // 7. Conversión a BLOB JPEG (Soluciona error de tamaño en Mayo)
            // Retornamos una promesa que se resuelve con el dataUrl para no romper el flujo
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

                    // Cleanup download link
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
            notify.error('Error de memoria en el dispositivo. Intenta cerrar otras pestañas.', 'Error de Captura');
            // Cleanup si falló antes de remover
            const w = document.getElementById('export-capture-wrapper');
            if (w) w.remove();
            throw error;
        }
    }
};
