import { toBlob } from 'html-to-image';
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
 * Utilidad centralizada para exportar elementos del DOM con un marco premium
 * y alta resolución, garantizando consistencia en móviles y escritorio.
 */
export const exportHelper = {
    /**
     * Captura un elemento y lo descarga como PNG con un diseño mejorado.
     */
    captureAndDownload: async (element: HTMLElement, options: ExportOptions) => {
        const { 
            fileName, 
            title, 
            subtitle, 
            departmentName, 
            pixelRatio = 2 // Reducido a 2 para mayor estabilidad en móviles (sigue siendo alta res)
        } = options;

        try {
            notify.info('Optimizando imagen para alta resolución...', 'Generando Exportación');

            // 1. Preparar el Contenedor de Captura (Off-screen)
            const wrapper = document.createElement('div');
            wrapper.style.position = 'absolute';
            wrapper.style.left = '-10000px'; 
            wrapper.style.top = '0';
            wrapper.style.width = '1400px'; // Un poco más estrecho para evitar desbordamientos
            wrapper.style.backgroundColor = '#f8fafc';
            wrapper.style.padding = '40px';
            wrapper.style.fontFamily = "'Inter', sans-serif";
            wrapper.style.zIndex = '-9999';
            wrapper.style.pointerEvents = 'none';
            // Importante: Forzar estilos que se pierden al clonar
            wrapper.style.color = '#1e293b';
            wrapper.style.lineHeight = '1.5';

            // 2. Crear Encabezado Premium
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.style.marginBottom = '30px';
            header.style.padding = '20px';
            header.style.backgroundColor = 'white';
            header.style.borderRadius = '16px';
            header.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
            header.style.borderLeft = '6px solid #d97706';

            const headerInfo = document.createElement('div');
            
            const mainTitle = document.createElement('h1');
            mainTitle.innerText = title;
            mainTitle.style.margin = '0';
            mainTitle.style.fontSize = '28px';
            mainTitle.style.fontWeight = '800';
            mainTitle.style.color = '#1e293b';

            const subtext = document.createElement('div');
            subtext.style.marginTop = '4px';
            subtext.style.fontSize = '16px';
            subtext.style.color = '#64748b';
            subtext.innerText = `${departmentName ? departmentName + ' • ' : ''}${subtitle || dayjs().format('MMMM YYYY')}`;

            headerInfo.appendChild(mainTitle);
            headerInfo.appendChild(subtext);

            // Logo Placeholder (Using CSS since we can't easily import Logo.tsx component here as a string)
            const logoContainer = document.createElement('div');
            logoContainer.style.display = 'flex';
            logoContainer.style.flexDirection = 'column';
            logoContainer.style.alignItems = 'flex-end';
            
            const brand = document.createElement('div');
            brand.innerText = 'UJIERES APP';
            brand.style.fontWeight = '900';
            brand.style.fontSize = '20px';
            brand.style.background = 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
            brand.style.webkitBackgroundClip = 'text';
            brand.style.webkitTextFillColor = 'transparent';
            
            logoContainer.appendChild(brand);
            
            header.appendChild(headerInfo);
            header.appendChild(logoContainer);

            // 3. Clonar y Estilizar el Contenido
            const clone = element.cloneNode(true) as HTMLElement;
            clone.style.width = '100%';
            clone.style.backgroundColor = 'transparent';
            clone.style.boxShadow = 'none';
            clone.style.visibility = 'visible';

            // 4. Pie de página
            const footer = document.createElement('div');
            footer.style.marginTop = '30px';
            footer.style.textAlign = 'center';
            footer.style.fontSize = '12px';
            footer.style.color = '#94a3b8';
            footer.innerText = `Generado el ${dayjs().format('DD/MM/YYYY HH:mm')} • © Ujieres App`;

            // Ensamblar todo
            wrapper.appendChild(header);
            wrapper.appendChild(clone);
            wrapper.appendChild(footer);
            
            // BUSCAR UN CONTENEDOR DENTRO DEL TEMA MANTINE
            // Si el elemento original tiene un padre, lo ponemos ahí para heredar variables CSS
            const parent = element.parentElement || document.body;
            parent.appendChild(wrapper);

            // 5. Esperar a que las fuentes y estilos se asienten (más tiempo en móviles)
            await document.fonts.ready;
            await new Promise(resolve => setTimeout(resolve, 500));

            // 6. Captura como BLOB (mucho más fiable en móviles que DataURL)
            const blob = await toBlob(wrapper, {
                quality: 1.0,
                pixelRatio,
                backgroundColor: '#f8fafc',
                cacheBust: true,
                style: {
                    borderRadius: '0'
                }
            });

            if (!blob) throw new Error('Blob generation failed');

            // 7. Descargar usando URL de objeto
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = blobUrl;
            
            // Simular clic
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpiar
            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
                if (wrapper.parentNode) {
                    wrapper.parentNode.removeChild(wrapper);
                }
            }, 500);

            notify.success('Exportación completada con éxito');
            
            return blobUrl;
        } catch (error: any) {
            console.error('Export Error Detail:', error);
            // Mostrar mensaje de error más descriptivo
            const errorMsg = error.message?.includes('SecurityError') 
                ? 'Error de seguridad al acceder a recursos externos (CORS).' 
                : 'Error al procesar la imagen. El contenido podría ser demasiado grande.';
            
            notify.error(`${errorMsg} Por favor, intenta de nuevo desde otro navegador.`, 'Error de Exportación');
            throw error;
        }
    }
};
