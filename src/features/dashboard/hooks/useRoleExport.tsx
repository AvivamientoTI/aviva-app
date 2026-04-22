import { useState, useRef } from 'react';
import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import { exportHelper } from '../../../utils/exportHelper';
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

    const handleExportRole = async (format: 'png' | 'pdf') => {
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

            setTimeout(async () => {
                if (reportRef.current) {
                    try {
                        const dataUrl = await exportHelper.captureAndDownload(reportRef.current, {
                            fileName: `Mi_Rol_Servicio_${dayjs().format('MMMM_YYYY')}.png`,
                            title: 'Mi Rol de Servicio',
                            subtitle: dayjs().format('MMMM YYYY'),
                            departmentName: userProfile.departamento?.nombre || 'General',
                            pixelRatio: 2.5
                        });

                        if (format === 'pdf') {
                            const pdf = new jsPDF('p', 'mm', 'a4');
                            const imgProps = pdf.getImageProperties(dataUrl);
                            const pdfWidth = pdf.internal.pageSize.getWidth();
                            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                            pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                            pdf.save(`Mi_Rol_Servicio_${dayjs().format('MMMM_YYYY')}.pdf`);
                        }

                        notify.success('Tu rol ha sido exportado exitosamente.', '¡Listo!');
                    } catch (err) {
                        console.error('Error in export:', err);
                        notify.error('Error al generar el documento del rol.');
                    } finally {
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
