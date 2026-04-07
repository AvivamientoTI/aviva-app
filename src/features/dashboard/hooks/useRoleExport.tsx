import { useState, useRef } from 'react';
import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { analyticsService } from '../../../services/analyticsService';
import { notify } from '../../../utils/notificationsHelper';

/**
 * Hook para exportar el rol de servicio del usuario a PDF/PNG con alta calidad.
 * Utiliza renderizado off-screen para asegurar consistencia en móviles.
 */
export function useRoleExport(userProfile: any) {
    const [exporting, setExporting] = useState(false);
    const [exportData, setExportData] = useState<any[] | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const handleExportRole = async () => {
        if (!userProfile?.usuario_id) return;
        setExporting(true);
        notify.info('Obteniendo información de tus roles...', 'Preparando Exportación');

        try {
            const now = dayjs();
            const data = await analyticsService.fetchMonthlyUserRole(
                userProfile.usuario_id,
                now.month() + 1,
                now.year()
            );

            if (data.length === 0) {
                notify.warning('No tienes servicios programados para este mes.', 'Sin Asignaciones');
                return;
            }

            setExportData(data);

            // Esperar a que el componente se renderice en el DOM (en el contenedor oculto o visible)
            setTimeout(async () => {
                if (reportRef.current) {
                    const originalElement = reportRef.current;
                    
                    // Estrategia Off-screen para consistencia móvil
                    const clone = originalElement.cloneNode(true) as HTMLElement;
                    const container = document.createElement('div');
                    container.style.position = 'fixed';
                    container.style.left = '-9999px';
                    container.style.top = '-9999px';
                    container.style.width = '850px'; // Ancho estándar para reportes A4 aprox
                    container.style.backgroundColor = 'white';
                    container.appendChild(clone);
                    document.body.appendChild(container);

                    try {
                        const dataUrl = await toPng(clone, { 
                            quality: 1.0, 
                            pixelRatio: 3,
                            cacheBust: true,
                            style: {
                                visibility: 'visible',
                                position: 'static',
                                width: '850px'
                            }
                        });

                        const pdf = new jsPDF('p', 'mm', 'a4');
                        const imgProps = pdf.getImageProperties(dataUrl);
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                        
                        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                        pdf.save(`Mi_Rol_Servicio_${dayjs().format('MMMM_YYYY')}.pdf`);
                        
                        notify.success('Tu rol ha sido exportado exitosamente.', '¡Listo!');
                    } catch (err) {
                        console.error('Error in toPng:', err);
                        notify.error('Error al generar la imagen del rol.');
                    } finally {
                        document.body.removeChild(container);
                        setExportData(null);
                    }
                }
            }, 800);
        } catch (error) {
            console.error('Error exporting role:', error);
            notify.error('No se pudo generar el documento de tu rol.');
        } finally {
            setExporting(false);
        }
    };

    return {
        exporting,
        exportData,
        reportRef,
        handleExportRole
    };
}
