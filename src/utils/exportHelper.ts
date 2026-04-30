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

import * as Sentry from "@sentry/react";

const isMobile = () =>
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;

export const exportHelper = {
    captureAndDownload: async (element: HTMLElement, options: ExportOptions): Promise<string> => {
        const { fileName: originalFileName, title, subtitle, departmentName } = options;
        const fileName = originalFileName.replace('.png', '.jpg');
        
        // --- Optimización Móvil ---
        const elementHeight = element.offsetHeight;
        let ratio = options.pixelRatio ?? (isMobile() ? 1.5 : 2);

        // Si el elemento es muy alto, bajamos el ratio para evitar que Safari crashee el Canvas
        if (!options.pixelRatio) {
            if (isMobile() && elementHeight > 1200) {
                ratio = 1.0;
            } else if (elementHeight > 2500) {
                ratio = isMobile() ? 0.8 : 1.5;
            }
        }

        try {
            notify.info('Iniciando exportación...', 'Procesando Reporte');

            const contentCanvas = await toCanvas(element, {
                pixelRatio: ratio,
                backgroundColor: '#ffffff',
                skipFonts: false,
                fontEmbedCSS: isMobile() ? undefined : undefined, // html-to-image lo maneja internamente mejor si no se fuerza a veces
                style: {
                   transform: 'scale(1)', // Asegurar que no hay zooms raros
                }
            });

            // 2. Dimensiones del canvas final (contenido + header + footer + padding)
            const PADDING = Math.round(32 * ratio);
            const HEADER_H = Math.round(90 * ratio);
            const FOOTER_H = Math.round(40 * ratio);
            const BORDER_W = Math.round(8 * ratio);

            const totalWidth = contentCanvas.width + PADDING * 2;
            const totalHeight = contentCanvas.height + HEADER_H + FOOTER_H + PADDING * 2;

            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = totalWidth;
            finalCanvas.height = totalHeight;

            const ctx = finalCanvas.getContext('2d')!;

            // 3. Fondo blanco
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, totalWidth, totalHeight);

            // 4. Dibujar header
            const headerY = PADDING / 2;
            const headerH = HEADER_H;
            const headerX = PADDING;
            const headerW = totalWidth - PADDING * 2;

            // Fondo del header
            ctx.fillStyle = '#ffffff';
            roundRect(ctx, headerX, headerY, headerW, headerH, Math.round(12 * ratio));

            // Borde izquierdo dorado
            ctx.fillStyle = '#d97706';
            ctx.fillRect(headerX, headerY, BORDER_W, headerH);

            // Borde sutil alrededor del header
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = ratio;
            roundRectStroke(ctx, headerX, headerY, headerW, headerH, Math.round(12 * ratio));

            // Título
            ctx.fillStyle = '#0f172a';
            ctx.font = `900 ${Math.round(20 * ratio)}px -apple-system, BlinkMacSystemFont, sans-serif`;
            ctx.textBaseline = 'middle';
            const titleX = headerX + BORDER_W + Math.round(20 * ratio);
            ctx.fillText(title.toUpperCase(), titleX, headerY + headerH * 0.38);

            // Subtítulo
            const subtitleText = `${departmentName ? departmentName + '  |  ' : ''}${subtitle || dayjs().format('MMMM YYYY')}`.toUpperCase();
            ctx.fillStyle = '#64748b';
            ctx.font = `700 ${Math.round(11 * ratio)}px -apple-system, BlinkMacSystemFont, sans-serif`;
            ctx.fillText(subtitleText, titleX, headerY + headerH * 0.68);

            // Brand "UJIERES APP"
            ctx.fillStyle = '#d97706';
            ctx.font = `900 ${Math.round(13 * ratio)}px -apple-system, BlinkMacSystemFont, sans-serif`;
            ctx.textAlign = 'right';
            ctx.fillText('UJIERES APP', headerX + headerW - Math.round(20 * ratio), headerY + headerH / 2);
            ctx.textAlign = 'left';

            // 5. Dibujar contenido
            const contentY = PADDING / 2 + HEADER_H + PADDING / 2;
            ctx.drawImage(contentCanvas, PADDING, contentY);

            // 6. Dibujar footer
            const footerY = contentY + contentCanvas.height + Math.round(12 * ratio);
            ctx.fillStyle = '#94a3b8';
            ctx.font = `600 ${Math.round(9 * ratio)}px -apple-system, BlinkMacSystemFont, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(
                `REPORTE OFICIAL  •  GENERADO EL ${dayjs().format('DD/MM/YYYY HH:mm')}  •  © UJIERES APP SYSTEM`,
                totalWidth / 2,
                footerY + FOOTER_H / 2
            );
            ctx.textAlign = 'left';

            // 7. Obtener dataUrl para PDF (jsPDF)
            const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.92);

            // 8. Descargar como BLOB (mejor compatibilidad móvil)
            return new Promise<string>((resolve) => {
                finalCanvas.toBlob((blob) => {
                    if (!blob) {
                        notify.error('Error al procesar la imagen.');
                        resolve(dataUrl);
                        return;
                    }
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                    }, 100);
                    notify.success('Reporte generado exitosamente', '¡Éxito!');
                    resolve(dataUrl);
                }, 'image/jpeg', 0.92);
            });

        } catch (error) {
            console.error('EXPORT ERROR:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            Sentry.captureException(error, {
                tags: { feature: 'export_png', is_mobile: isMobile() },
                extra: { options, elementHeight: element?.offsetHeight, errorDetails: errorMessage }
            });
            notify.error('Error al generar el reporte. Intenta de nuevo.', 'Error');
            throw error;
        }
    }
};

// Helpers para dibujar rectángulos con bordes redondeados en canvas
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

function roundRectStroke(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.stroke();
}
