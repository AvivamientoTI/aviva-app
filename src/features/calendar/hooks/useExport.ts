import { useCallback, type MutableRefObject } from 'react';
import { jsPDF } from 'jspdf';
import { exportHelper } from '../../../utils/exportHelper';
import { notify } from '../../../utils/notificationsHelper';
import { exportCalendarImage } from '../utils/calendarImageExport';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

// Colores de uniforme a hex
const UNIFORM_COLORS: Record<string, { bg: number[]; label: string }> = {
    'Camisa Azul':   { bg: [219, 234, 254], label: 'Azul' },
    'Camisa Vino':   { bg: [252, 231, 243], label: 'Vino' },
    'Uniforme Gris': { bg: [243, 244, 246], label: 'Gris' },
    'Camisa Blanca': { bg: [255, 255, 255], label: 'Blanca' },
    'Camisa Negra':  { bg: [209, 213, 219], label: 'Negra' },
};

function getUniformColor(uniforme: string) {
    for (const key of Object.keys(UNIFORM_COLORS)) {
        if (uniforme?.toLowerCase().includes(key.toLowerCase().split(' ')[1] ?? '')) {
            return UNIFORM_COLORS[key];
        }
    }
    return { bg: [243, 244, 246], label: uniforme || 'N/A' };
}

/**
 * Genera un PDF directamente desde los datos de asignaciones.
 * Sin captura de DOM → texto vectorial → nitidez perfecta en cualquier dispositivo.
 */
function generateSchedulePdf(
    groupedAssignments: Record<string, any>,
    options: { title: string; subtitle: string; departmentName: string }
) {
    const { title, subtitle, departmentName } = options;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = pdf.internal.pageSize.getWidth();   // 210
    const PH = pdf.internal.pageSize.getHeight();  // 297
    const ML = 14; // margin left
    const MR = 14; // margin right
    const CW = PW - ML - MR; // content width

    // Colores del tema
    const GOLD   = [217, 119, 6]  as [number,number,number];
    const DARK   = [15, 23, 42]   as [number,number,number];
    const GRAY   = [100, 116, 139] as [number,number,number];
    const LIGHT  = [248, 250, 252] as [number,number,number];
    const BORDER = [226, 232, 240] as [number,number,number];
    const WHITE  = [255, 255, 255] as [number,number,number];

    let pageNum = 1;
    const totalPages = () => pdf.getNumberOfPages();

    const drawPageHeader = () => {
        // Fondo header
        pdf.setFillColor(...LIGHT);
        pdf.roundedRect(ML, 10, CW, 22, 3, 3, 'F');
        // Borde dorado izquierdo
        pdf.setFillColor(...GOLD);
        pdf.rect(ML, 10, 2.5, 22, 'F');
        // Título
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(...DARK);
        pdf.text(title.toUpperCase(), ML + 6, 17.5);
        // Subtítulo
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(...GRAY);
        const sub = departmentName ? `${departmentName}  |  ${subtitle}` : subtitle;
        pdf.text(sub.toUpperCase(), ML + 6, 23);
        // Brand
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(...GOLD);
        pdf.text('UJIERES APP', PW - MR, 20, { align: 'right' });
    };

    const drawPageFooter = (page: number, total: number) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(...GRAY);
        const left = `Generado el ${dayjs().format('DD/MM/YYYY HH:mm')}  •  © UJIERES APP SYSTEM`;
        const right = `Página ${page} de ${total}`;
        pdf.text(left, ML, PH - 6);
        pdf.text(right, PW - MR, PH - 6, { align: 'right' });
        // Línea separadora
        pdf.setDrawColor(...BORDER);
        pdf.setLineWidth(0.3);
        pdf.line(ML, PH - 9, PW - MR, PH - 9);
    };

    // Ordenar fechas cronológicamente
    const sortedDates = Object.keys(groupedAssignments).sort();

    drawPageHeader();
    let y = 38; // cursor Y

    const BOTTOM_LIMIT = PH - 18; // espacio para footer

    const addPageIfNeeded = (needed: number) => {
        if (y + needed > BOTTOM_LIMIT) {
            drawPageFooter(pageNum, 0); // placeholder, se sobreescribe al final
            pdf.addPage();
            pageNum++;
            drawPageHeader();
            y = 38;
        }
    };

    for (const fecha of sortedDates) {
        const group = groupedAssignments[fecha];
        const dateLabel = dayjs(fecha).format('dddd D [de] MMMM');
        const servicio = group.servicio || 'Servicio';
        const uniforme = group.uniforme || '';
        const encargado = group.encargado || null;
        const servers: any[] = group.assignments || [];

        // Altura estimada del bloque: header día (10) + encargado (5 opt) + servidores (5 c/u) + gap (4)
        const blockHeight = 10 + (encargado ? 5 : 0) + servers.length * 5.5 + 6;
        addPageIfNeeded(blockHeight);

        // --- Cabecera del día ---
        const uniformeColor = getUniformColor(uniforme);
        pdf.setFillColor(uniformeColor.bg[0], uniformeColor.bg[1], uniformeColor.bg[2]);
        pdf.roundedRect(ML, y, CW, 9, 2, 2, 'F');
        pdf.setDrawColor(...BORDER);
        pdf.setLineWidth(0.25);
        pdf.roundedRect(ML, y, CW, 9, 2, 2, 'S');

        // Fecha + servicio
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...DARK);
        const dateStr = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
        pdf.text(dateStr, ML + 3, y + 5.8);

        // Badge servicio (derecha)
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...GRAY);
        pdf.text(servicio, PW - MR - 3, y + 5.8, { align: 'right' });

        y += 10;

        // Encargado
        if (encargado) {
            pdf.setFont('helvetica', 'bolditalic');
            pdf.setFontSize(7.5);
            pdf.setTextColor(...GOLD);
            pdf.text(`Encargado: ${encargado}`, ML + 3, y + 3.5);
            y += 5;
        }

        // Lista de servidores en 2 columnas
        const COL2 = Math.ceil(servers.length / 2);
        const COL_W = CW / 2 - 2;
        for (let i = 0; i < servers.length; i++) {
            const server = servers[i];
            const col = i % 2 === 0 ? 0 : 1;
            const row = Math.floor(i / 2);
            const sx = ML + 3 + col * (COL_W + 4);
            const sy = y + row * 5.5 + 4;

            // Bullet
            pdf.setFillColor(...GOLD);
            pdf.circle(sx, sy - 0.8, 0.7, 'F');

            // Nombre
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7.5);
            pdf.setTextColor(...DARK);
            pdf.text(server.nombre || '', sx + 2.5, sy);

            // Posición
            if (server.posicion) {
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(6.5);
                pdf.setTextColor(...GRAY);
                pdf.text(server.posicion, sx + 2.5, sy + 3.2);
            }
        }

        const rows = Math.ceil(servers.length / 2);
        y += rows * 5.5 + 8;
    }

    // Sobreescribir footers con total de páginas correcto
    const total = pdf.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
        pdf.setPage(p);
        drawPageFooter(p, total);
    }

    return pdf;
}

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
            const pdf = generateSchedulePdf(groupedAssignments, {
                title: options.title || 'Programación de Servicios',
                subtitle: options.subtitle || dayjs().format('MMMM YYYY'),
                departmentName: options.departmentName || '',
            });
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
