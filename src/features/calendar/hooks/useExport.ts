import { useCallback, type MutableRefObject } from 'react';
import { jsPDF } from 'jspdf';
import { exportHelper } from '../../../utils/exportHelper';
import { notify } from '../../../utils/notificationsHelper';
import { exportCalendarImage, generateCalendarCanvas } from '../utils/calendarImageExport';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');



export function useExport() {
    // Export del calendario como PDF generado desde datos (siempre nítido)
    const exportSchedulePdf = useCallback(async (
        groupedAssignments: Record<string, any>,
        options: { title?: string; subtitle?: string; departmentName?: string }
    ) => {
        if (!groupedAssignments || Object.keys(groupedAssignments).length === 0) {
            notify.warning('No hay asignaciones para exportar.');
            return;
        }
        try {
            notify.info('Generando PDF...', 'Exportando');
            const dateLabel = dayjs().format('MMMM_YYYY');
            
            const canvas = generateCalendarCanvas(groupedAssignments, options.departmentName || '');
            if (!canvas) throw new Error('No se pudo generar el canvas del calendario');

            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = pdf.internal.pageSize.getHeight();
            
            const margin = 10;
            const maxWidth = pdfW - (margin * 2);
            const maxHeight = pdfH - (margin * 2);

            const imgRatio = canvas.width / canvas.height;
            const pdfRatio = maxWidth / maxHeight;
            
            let finalW = maxWidth;
            let finalH = finalW / imgRatio;

            // Si la imagen es más alta que la página, la escalamos para que quepa en alto
            if (finalH > maxHeight) {
                finalH = maxHeight;
                finalW = finalH * imgRatio;
            }

            const x = (pdfW - finalW) / 2;
            const y = margin;
            
            pdf.addImage(imgData, 'JPEG', x, y, finalW, finalH);
            pdf.save(`Calendario_Servidores_${dateLabel}.pdf`);
            notify.success('PDF generado exitosamente', '¡Éxito!');
        } catch (err) {
            console.error('Export PDF error:', err);
            notify.error('Error al generar el PDF.');
        }
    }, []);

    // Export de imagen (mantener para vista de detalle)
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
        });
    }, []);

    return { exportToPng, exportSchedulePdf, exportCalendarImage };
}
