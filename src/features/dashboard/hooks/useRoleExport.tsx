import { useState, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { IconChecklist } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { analyticsService } from '../../../services/analyticsService';

export function useRoleExport(userProfile: any) {
    const [exporting, setExporting] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [exportData, setExportData] = useState<any[] | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const handleExportRole = async () => {
        if (!userProfile?.usuario_id) return;
        setExporting(true);
        try {
            const now = dayjs();
            const data = await analyticsService.fetchMonthlyUserRole(
                userProfile.usuario_id,
                now.month() + 1,
                now.year()
            );

            if (data.length === 0) {
                notifications.show({
                    title: 'Sin Asignaciones',
                    message: 'No tienes servicios programados para este mes.',
                    color: 'orange'
                });
                return;
            }

            setExportData(data);

            // Wait for render
            setTimeout(async () => {
                if (reportRef.current) {
                    const dataUrl = await toPng(reportRef.current, { quality: 0.95, pixelRatio: 2 });
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const imgProps = pdf.getImageProperties(dataUrl);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`Mi_Rol_Servicio_${dayjs().format('MMMM_YYYY')}.pdf`);
                    
                    setExportData(null);
                    notifications.show({
                        title: '¡Éxito!',
                        message: 'Tu rol ha sido exportado.',
                        color: 'teal',
                        icon: <IconChecklist size={18} />
                    });
                }
            }, 600);
        } catch (error) {
            console.error('Error exporting role:', error);
            notifications.show({ title: 'Error', message: 'No se pudo generar el PDF de tu rol', color: 'red' });
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
