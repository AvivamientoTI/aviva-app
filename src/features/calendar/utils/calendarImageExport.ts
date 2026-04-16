import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { notify } from '../../../utils/notificationsHelper';

dayjs.locale('es');

// Orden visual: Lun(1)→Dom(0)
const DAY_ORDER = (d: number) => (d === 0 ? 7 : d);
const DAY_NAMES: Record<number, string> = {
    0: 'DOMINGO', 1: 'LUNES', 2: 'MARTES', 3: 'MIERCOLES',
    4: 'JUEVES', 5: 'VIERNES', 6: 'SABADO',
};

interface UniformStyle {
    headerBg: string;
    headerText: string;
    cellBg: string;
    accentColor: string;
    label: string;
}

function getUniformStyle(uniforme: string, servicio: string): UniformStyle {
    const u = (uniforme || '').toLowerCase();
    const s = (servicio || '').toLowerCase();
    if (s.includes('niño') || s.includes('infantil') || s.includes('kids'))
        return { headerBg: '#7c3aed', headerText: '#fff', cellBg: '#ede9fe', accentColor: '#5b21b6', label: servicio.toUpperCase() };
    if (s.includes('matrimoni') || s.includes('boda'))
        return { headerBg: '#0369a1', headerText: '#fff', cellBg: '#e0f2fe', accentColor: '#0284c7', label: servicio.toUpperCase() };
    if (s.includes('formac') || s.includes('capacit'))
        return { headerBg: '#059669', headerText: '#fff', cellBg: '#d1fae5', accentColor: '#047857', label: servicio.toUpperCase() };
    if (s.includes('especial') || s.includes('aniversar'))
        return { headerBg: '#d97706', headerText: '#fff', cellBg: '#fef3c7', accentColor: '#b45309', label: servicio.toUpperCase() };
    if (u.includes('azul'))
        return { headerBg: '#1d4ed8', headerText: '#fff', cellBg: '#dbeafe', accentColor: '#1e40af', label: 'CAMISA AZUL' };
    if (u.includes('vino') || u.includes('rojo') || u.includes('bordo'))
        return { headerBg: '#be185d', headerText: '#fff', cellBg: '#fce7f3', accentColor: '#9d174d', label: 'CAMISA VINO' };
    if (u.includes('gris'))
        return { headerBg: '#475569', headerText: '#fff', cellBg: '#f1f5f9', accentColor: '#334155', label: 'UNI FORMAL GRIS' };
    if (u.includes('beige') || u.includes('crema'))
        return { headerBg: '#92400e', headerText: '#fff', cellBg: '#fef9c3', accentColor: '#78350f', label: 'CAMISA BEIGE' };
    if (u.includes('blanca') || u.includes('blanco'))
        return { headerBg: '#64748b', headerText: '#fff', cellBg: '#f8fafc', accentColor: '#475569', label: 'CAMISA BLANCA' };
    if (u.includes('negra') || u.includes('negro'))
        return { headerBg: '#111827', headerText: '#fff', cellBg: '#e5e7eb', accentColor: '#1f2937', label: 'CAMISA NEGRA' };
    if (u.includes('formal'))
        return { headerBg: '#b45309', headerText: '#fff', cellBg: '#fef3c7', accentColor: '#92400e', label: 'UNI FORMAL' };
    return { headerBg: '#374151', headerText: '#fff', cellBg: '#f3f4f6', accentColor: '#1f2937', label: uniforme || 'SERVICIO' };
}

function getMondayOfWeek(dateStr: string): string {
    const d = dayjs(dateStr);
    const dow = d.day();
    const daysToMonday = dow === 0 ? 6 : dow - 1;
    return d.subtract(daysToMonday, 'day').format('YYYY-MM-DD');
}

function abbreviatePos(pos: string): string {
    if (!pos) return 'CARGO';
    const p = pos.toUpperCase();
    if (p.includes('CARRO') || p.includes('PARQUEO')) return 'CARRO';
    if (p.includes('PUERTA') || p.includes('ENTRADA')) return 'PUERTA';
    if (p.includes('ALTAR D') || p.includes('PLATAFORMA')) return 'ALTAR D';
    if (p.includes('ALTAR IZ')) return 'ALTAR IZ';
    if (p.includes('ALTAR')) return 'ALTAR';
    if (p.includes('BAÑO') || p.includes('BANO')) return 'BAÑOS';
    if (p.includes('NIÑO') || p.includes('INFANTIL')) return 'NIÑOS';
    if (p.includes('LIBRE')) return 'LIBRE';
    if (p.includes('SOUND') || p.includes('SONIDO')) return 'SONIDO';
    if (p.includes('USHER')) return 'USHER';
    return p.length > 10 ? p.substring(0, 9) + '.' : p;
}

// ─── Canvas helpers ────────────────────────────────────────────────────────────

function drawRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    r: number, fill: string, stroke?: string, strokeW = 1
) {
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
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeW;
        ctx.stroke();
    }
}

// ─── Main draw function ────────────────────────────────────────────────────────

function drawCalendar(
    ctx: CanvasRenderingContext2D,
    groupedAssignments: Record<string, any>,
    departmentName: string,
    S: number  // scale factor
): number /* total height drawn */ {
    const dates = Object.keys(groupedAssignments).sort();
    if (dates.length === 0) return 0;

    const PAD = Math.round(16 * S);
    const GAP = Math.round(4 * S);
    const CELL_W = Math.round(190 * S);
    const HEADER_H = Math.round(22 * S);  // day column header
    const CELL_HEADER_H = Math.round(20 * S);
    const ROW_H_BASE = Math.round(14 * S);  // per server row inside cell

    // Detect used days of week
    const usedDowSet = new Set(dates.map(d => dayjs(d).day()));
    const usedDow = [...usedDowSet].sort((a, b) => DAY_ORDER(a) - DAY_ORDER(b));
    const numCols = usedDow.length;
    const GRID_W = numCols * CELL_W + (numCols - 1) * GAP;

    // Group dates by week
    const weekMap = new Map<string, Set<string>>();
    for (const d of dates) {
        const monday = getMondayOfWeek(d);
        if (!weekMap.has(monday)) weekMap.set(monday, new Set());
        weekMap.get(monday)!.add(d);
    }
    const sortedWeeks = [...weekMap.keys()].sort();

    // ── Title block ──────────────────────────────────────────────────────────
    const TITLE_H = Math.round(48 * S);
    const titleY = PAD;
    drawRoundRect(ctx, PAD, titleY, GRID_W, TITLE_H, Math.round(8 * S), '#fffbeb', '#d97706', Math.round(2.5 * S));

    const monthLabel = dayjs(dates[0]).format('MMMM YYYY').toUpperCase();
    ctx.fillStyle = '#0f172a';
    ctx.font = `900 ${Math.round(20 * S)}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ROL DE ${monthLabel}`, PAD + GRID_W / 2, titleY + TITLE_H / 2);

    if (departmentName) {
        ctx.fillStyle = '#d97706';
        ctx.font = `800 ${Math.round(10 * S)}px Arial, Helvetica, sans-serif`;
        ctx.fillText(departmentName.toUpperCase(), PAD + GRID_W / 2, titleY + TITLE_H / 2 + Math.round(16 * S));
    }
    ctx.textAlign = 'left';

    let y = titleY + TITLE_H + GAP * 2;

    // ── Day headers ──────────────────────────────────────────────────────────
    for (let i = 0; i < usedDow.length; i++) {
        const x = PAD + i * (CELL_W + GAP);
        drawRoundRect(ctx, x, y, CELL_W, HEADER_H, Math.round(5 * S), '#0f172a');
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${Math.round(10 * S)}px Arial, Helvetica, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(DAY_NAMES[usedDow[i]], x + CELL_W / 2, y + HEADER_H / 2);
    }
    ctx.textAlign = 'left';
    y += HEADER_H + GAP;

    // ── Week rows ────────────────────────────────────────────────────────────
    for (const monday of sortedWeeks) {
        // First pass: calculate max cell height for this row
        let maxCellH = 0;
        const cellHeights: number[] = [];
        for (const dow of usedDow) {
            const daysFromMonday = dow === 0 ? 6 : dow - 1;
            const cellDateStr = dayjs(monday).add(daysFromMonday, 'day').format('YYYY-MM-DD');
            const group = groupedAssignments[cellDateStr];
            if (!group) { cellHeights.push(0); continue; }

            const isSpecial = ['niño','matrimoni','formac','especial','aniversar','infantil']
                .some(k => (group.servicio || '').toLowerCase().includes(k));
            const servers: any[] = group.assignments || [];
            const encargado = group.encargado;

            const h = CELL_HEADER_H
                + (isSpecial && group.servicio ? Math.round(14 * S) : 0)
                + (encargado ? Math.round(14 * S) : 0)
                + servers.length * ROW_H_BASE
                + Math.round(10 * S); // padding bottom
            cellHeights.push(h);
            if (h > maxCellH) maxCellH = h;
        }

        // Second pass: draw cells
        for (let i = 0; i < usedDow.length; i++) {
            const dow = usedDow[i];
            const daysFromMonday = dow === 0 ? 6 : dow - 1;
            const cellDateStr = dayjs(monday).add(daysFromMonday, 'day').format('YYYY-MM-DD');
            const group = groupedAssignments[cellDateStr];
            if (!group) continue;

            const x = PAD + i * (CELL_W + GAP);
            const uStyle = getUniformStyle(group.uniforme, group.servicio);
            const isSpecial = ['niño','matrimoni','formac','especial','aniversar','infantil']
                .some(k => (group.servicio || '').toLowerCase().includes(k));
            const servers: any[] = group.assignments || [];
            const encargado = group.encargado;
            const dayNum = dayjs(cellDateStr).date();

            // Cell background
            const cellH = maxCellH;
            drawRoundRect(ctx, x, y, CELL_W, cellH, Math.round(5 * S), uStyle.cellBg, uStyle.accentColor + '55', 1);

            // Cell header
            ctx.fillStyle = uStyle.headerBg;
            // top rounded, bottom straight
            ctx.beginPath();
            const r = Math.round(5 * S);
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + CELL_W - r, y);
            ctx.quadraticCurveTo(x + CELL_W, y, x + CELL_W, y + r);
            ctx.lineTo(x + CELL_W, y + CELL_HEADER_H);
            ctx.lineTo(x, y + CELL_HEADER_H);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fillStyle = uStyle.headerBg;
            ctx.fill();

            ctx.fillStyle = uStyle.headerText;
            ctx.font = `900 ${Math.round(9 * S)}px Arial, Helvetica, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${uStyle.label} ${dayNum}`, x + CELL_W / 2, y + CELL_HEADER_H / 2);
            ctx.textAlign = 'left';

            let cy = y + CELL_HEADER_H;

            // Special service badge
            if (isSpecial && group.servicio) {
                const BADGE_H = Math.round(14 * S);
                ctx.fillStyle = uStyle.accentColor;
                ctx.fillRect(x, cy, CELL_W, BADGE_H);
                ctx.fillStyle = '#ffffff';
                ctx.font = `800 ${Math.round(7.5 * S)}px Arial, Helvetica, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(group.servicio.toUpperCase(), x + CELL_W / 2, cy + BADGE_H / 2);
                ctx.textAlign = 'left';
                cy += BADGE_H;
            }

            const bodyX = x + Math.round(5 * S);
            cy += Math.round(4 * S);

            // Encargado row
            if (encargado) {
                ctx.fillStyle = uStyle.accentColor;
                ctx.font = `800 ${Math.round(8 * S)}px Arial, Helvetica, sans-serif`;
                ctx.textBaseline = 'top';
                const encText = `ENCAR: ${encargado}`;
                // clip text if too wide
                ctx.save();
                ctx.rect(bodyX, cy, CELL_W - Math.round(10 * S), ROW_H_BASE);
                ctx.clip();
                ctx.fillText(encText, bodyX, cy);
                ctx.restore();
                // underline
                ctx.strokeStyle = uStyle.accentColor + '44';
                ctx.lineWidth = 0.5 * S;
                ctx.beginPath();
                ctx.moveTo(bodyX, cy + Math.round(10 * S));
                ctx.lineTo(x + CELL_W - Math.round(5 * S), cy + Math.round(10 * S));
                ctx.stroke();
                cy += ROW_H_BASE;
            }

            // Servers
            for (const sv of servers) {
                const posLabel = abbreviatePos(sv.posicion) + ':';
                const nombre = sv.nombre || '';
                const posW = Math.round(42 * S);

                ctx.fillStyle = uStyle.accentColor;
                ctx.font = `700 ${Math.round(7.5 * S)}px Arial, Helvetica, sans-serif`;
                ctx.textBaseline = 'top';
                ctx.fillText(posLabel, bodyX, cy);

                ctx.fillStyle = '#0f172a';
                ctx.font = `400 ${Math.round(8 * S)}px Arial, Helvetica, sans-serif`;
                ctx.save();
                ctx.rect(bodyX + posW, cy, CELL_W - posW - Math.round(10 * S), ROW_H_BASE);
                ctx.clip();
                ctx.fillText(nombre, bodyX + posW, cy);
                ctx.restore();

                cy += ROW_H_BASE;
            }
        }

        y += maxCellH + GAP;
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    y += GAP * 2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = S;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(PAD + GRID_W, y);
    ctx.stroke();
    y += Math.round(6 * S);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `400 ${Math.round(7 * S)}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
        `REPORTE OFICIAL  •  GENERADO EL ${dayjs().format('DD/MM/YYYY HH:mm')}  •  © UJIERES APP SYSTEM`,
        PAD + GRID_W / 2,
        y
    );
    ctx.textAlign = 'left';

    y += Math.round(20 * S);
    return y + PAD; // total height
}

// ─── Two-pass render: measure height then draw ────────────────────────────────

function measureCanvasSize(
    groupedAssignments: Record<string, any>,
    S: number
): { width: number; height: number } {
    const dates = Object.keys(groupedAssignments).sort();
    if (dates.length === 0) return { width: 900, height: 400 };

    const PAD = Math.round(16 * S);
    const GAP = Math.round(4 * S);
    const CELL_W = Math.round(190 * S);
    const HEADER_H = Math.round(22 * S);
    const CELL_HEADER_H = Math.round(20 * S);
    const ROW_H_BASE = Math.round(14 * S);
    const TITLE_H = Math.round(48 * S);

    const usedDowSet = new Set(dates.map(d => dayjs(d).day()));
    const usedDow = [...usedDowSet].sort((a, b) => DAY_ORDER(a) - DAY_ORDER(b));
    const numCols = usedDow.length;
    const GRID_W = numCols * CELL_W + (numCols - 1) * GAP;
    const CANVAS_W = GRID_W + PAD * 2;

    const weekMap = new Map<string, Set<string>>();
    for (const d of dates) {
        const monday = getMondayOfWeek(d);
        if (!weekMap.has(monday)) weekMap.set(monday, new Set());
        weekMap.get(monday)!.add(d);
    }
    const sortedWeeks = [...weekMap.keys()].sort();

    let totalH = PAD + TITLE_H + GAP * 2 + HEADER_H + GAP;

    for (const monday of sortedWeeks) {
        let maxCellH = 0;
        for (const dow of usedDow) {
            const daysFromMonday = dow === 0 ? 6 : dow - 1;
            const cellDateStr = dayjs(monday).add(daysFromMonday, 'day').format('YYYY-MM-DD');
            const group = groupedAssignments[cellDateStr];
            if (!group) continue;
            const isSpecial = ['niño','matrimoni','formac','especial','aniversar','infantil']
                .some(k => (group.servicio || '').toLowerCase().includes(k));
            const servers: any[] = group.assignments || [];
            const h = CELL_HEADER_H
                + (isSpecial && group.servicio ? Math.round(14 * S) : 0)
                + (group.encargado ? Math.round(14 * S) : 0)
                + servers.length * ROW_H_BASE
                + Math.round(10 * S);
            if (h > maxCellH) maxCellH = h;
        }
        totalH += maxCellH + GAP;
    }

    totalH += GAP * 2 + Math.round(6 * S) + Math.round(20 * S) + PAD;
    return { width: CANVAS_W, height: totalH };
}

// ─── Public export ────────────────────────────────────────────────────────────

export async function exportCalendarImage(
    groupedAssignments: Record<string, any>,
    departmentName: string
): Promise<void> {
    const dates = Object.keys(groupedAssignments);
    if (dates.length === 0) {
        notify.warning('No hay asignaciones para exportar.');
        return;
    }

    notify.info('Generando imagen del calendario...', 'Exportando');

    try {
        const S = 3; // scale / pixel ratio — 3× for crisp output
        const { width, height } = measureCanvasSize(groupedAssignments, S);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        drawCalendar(ctx, groupedAssignments, departmentName, S);

        const dateLabel = dayjs(dates.sort()[0]).format('MMMM_YYYY').toUpperCase();
        const fileName = `Rol_Servicios_${dateLabel}.jpg`;

        await new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    notify.error('Error al generar la imagen.');
                    resolve();
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
                }, 200);
                notify.success('Imagen generada exitosamente', '¡Éxito!');
                resolve();
            }, 'image/jpeg', 0.95);
        });

    } catch (err: any) {
        console.error('Calendar image export error:', err);
        notify.error('Error al generar la imagen del calendario.');
    }
}
