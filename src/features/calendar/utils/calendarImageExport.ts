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
        return { headerBg: '#7c3aed', headerText: '#fff', cellBg: '#ede9fe', accentColor: '#5b21b6', label: 'CULTO NIÑOS' };
    if (s.includes('matrimoni') || s.includes('boda'))
        return { headerBg: '#0369a1', headerText: '#fff', cellBg: '#e0f2fe', accentColor: '#0284c7', label: 'MATRIMONIO' };
    if (s.includes('formac') || s.includes('capacit'))
        return { headerBg: '#059669', headerText: '#fff', cellBg: '#d1fae5', accentColor: '#047857', label: 'FORMACIÓN' };
    if (s.includes('especial') || s.includes('aniversar'))
        return { headerBg: '#d97706', headerText: '#fff', cellBg: '#fef3c7', accentColor: '#b45309', label: 'ESPECIAL' };
    if (u.includes('azul'))
        return { headerBg: '#1d4ed8', headerText: '#fff', cellBg: '#dbeafe', accentColor: '#1e40af', label: 'CAMISA AZUL' };
    if (u.includes('vino') || u.includes('rojo') || u.includes('bordo'))
        return { headerBg: '#9f1239', headerText: '#fff', cellBg: '#ffe4e6', accentColor: '#881337', label: 'CAMISA VINO' };
    if (u.includes('gris'))
        return { headerBg: '#334155', headerText: '#fff', cellBg: '#f1f5f9', accentColor: '#1e293b', label: 'UNI FORMAL GRIS' };
    if (u.includes('beige') || u.includes('crema'))
        return { headerBg: '#92400e', headerText: '#fff', cellBg: '#fef9c3', accentColor: '#78350f', label: 'CAMISA BEIGE' };
    if (u.includes('blanca') || u.includes('blanco'))
        return { headerBg: '#475569', headerText: '#fff', cellBg: '#f8fafc', accentColor: '#334155', label: 'CAMISA BLANCA' };
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
    if (p.includes('ENCARGAD')) return 'ENCAR.';
    if (p.includes('CARRO') || p.includes('PARQUEO')) return 'CARRO';
    if (p.includes('PUERTA') || p.includes('ENTRADA')) return 'PUERTA';
    if (p.includes('ALTAR D') || p.includes('PLATAFORMA')) return 'ALT. D';
    if (p.includes('ALTAR IZ')) return 'ALT. IZ';
    if (p.includes('ALTAR')) return 'ALTAR';
    if (p.includes('BAÑO') || p.includes('BANO')) return 'BAÑOS';
    if (p.includes('NIÑO') || p.includes('INFANTIL')) return 'NIÑOS';
    if (p.includes('SERVIR') || p.includes('SERVIDOR')) return 'SERV.';
    if (p.includes('LIBRE')) return 'LIBRE';
    if (p.includes('SOUND') || p.includes('SONIDO')) return 'SONIDO';
    if (p.includes('USHER')) return 'USHER';
    if (p.includes('AYUDANT')) return 'AYUD.';
    if (p.includes('RECEPCI')) return 'RECEP.';
    if (p.includes('ACOMOD')) return 'ACOM.';
    return p.length > 9 ? p.substring(0, 8) + '.' : p;
}

// Truncate text to fit within maxPx pixels
function fitText(ctx: CanvasRenderingContext2D, text: string, maxPx: number): string {
    if (ctx.measureText(text).width <= maxPx) return text;
    let truncated = text;
    while (truncated.length > 1 && ctx.measureText(truncated + '…').width > maxPx) {
        truncated = truncated.slice(0, -1);
    }
    return truncated + '…';
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

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

// Draw the top-rounded header for a cell (bottom edge is straight)
function drawCellHeader(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    r: number, fill: string
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
}

// ─── Layout constants (all multiplied by scale S) ────────────────────────────

interface Layout {
    PAD: number;
    GAP: number;
    CELL_W: number;
    TITLE_H: number;
    DAY_HDR_H: number;
    CELL_HDR_H: number;
    BADGE_H: number;
    ENCAR_H: number;
    ROW_H: number;
    CELL_PAD: number;
    POS_W: number;
    RADIUS: number;
    F_TITLE: string;
    F_DEPT: string;
    F_DAY_HDR: string;
    F_CELL_HDR: string;
    F_BADGE: string;
    F_ENCAR: string;
    F_POS: string;
    F_NAME: string;
    F_FOOTER: string;
}

function makeLayout(S: number): Layout {
    return {
        PAD: Math.round(18 * S),
        GAP: Math.round(5 * S),
        CELL_W: Math.round(200 * S),
        TITLE_H: Math.round(56 * S),
        DAY_HDR_H: Math.round(26 * S),
        CELL_HDR_H: Math.round(24 * S),
        BADGE_H: Math.round(16 * S),
        ENCAR_H: Math.round(17 * S),
        ROW_H: Math.round(16 * S),
        CELL_PAD: Math.round(6 * S),
        POS_W: Math.round(48 * S),
        RADIUS: Math.round(6 * S),
        F_TITLE:    `900 ${Math.round(22 * S)}px Arial,Helvetica,sans-serif`,
        F_DEPT:     `700 ${Math.round(11 * S)}px Arial,Helvetica,sans-serif`,
        F_DAY_HDR:  `900 ${Math.round(11 * S)}px Arial,Helvetica,sans-serif`,
        F_CELL_HDR: `900 ${Math.round(10 * S)}px Arial,Helvetica,sans-serif`,
        F_BADGE:    `800 ${Math.round(8.5 * S)}px Arial,Helvetica,sans-serif`,
        F_ENCAR:    `700 ${Math.round(9 * S)}px Arial,Helvetica,sans-serif`,
        F_POS:      `700 ${Math.round(8.5 * S)}px Arial,Helvetica,sans-serif`,
        F_NAME:     `400 ${Math.round(9 * S)}px Arial,Helvetica,sans-serif`,
        F_FOOTER:   `400 ${Math.round(7.5 * S)}px Arial,Helvetica,sans-serif`,
    };
}

// ─── Cell height calculation ──────────────────────────────────────────────────

function calcCellHeight(group: any, L: Layout): number {
    if (!group) return 0;
    const isSpecial = isSpecialService(group.servicio);
    const servers: any[] = group.assignments || [];
    return L.CELL_HDR_H
        + (isSpecial && group.servicio ? L.BADGE_H : 0)
        + (group.encargado ? L.ENCAR_H : 0)
        + servers.length * L.ROW_H
        + L.CELL_PAD * 2;
}

function isSpecialService(servicio: string): boolean {
    return ['niño','matrimoni','formac','especial','aniversar','infantil']
        .some(k => (servicio || '').toLowerCase().includes(k));
}

// ─── Draw a single day cell ───────────────────────────────────────────────────

function drawCell(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    cellH: number,
    group: any,
    L: Layout
) {
    const uStyle = getUniformStyle(group.uniforme, group.servicio);
    const isSpecial = isSpecialService(group.servicio);
    const servers: any[] = group.assignments || [];

    // ── Cell background ────────────────────────────────────────────────────
    drawRoundRect(ctx, x, y, L.CELL_W, cellH, L.RADIUS, uStyle.cellBg, uStyle.accentColor + '40', Math.round(1.2));

    // ── Cell header bar ────────────────────────────────────────────────────
    drawCellHeader(ctx, x, y, L.CELL_W, L.CELL_HDR_H, L.RADIUS, uStyle.headerBg);
    ctx.fillStyle = uStyle.headerText;
    ctx.font = L.F_CELL_HDR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const headerLabel = `${uStyle.label}  ${group._dayNum}`;
    ctx.fillText(
        fitText(ctx, headerLabel, L.CELL_W - Math.round(8 * 3)),
        x + L.CELL_W / 2,
        y + L.CELL_HDR_H / 2
    );
    ctx.textAlign = 'left';

    let cy = y + L.CELL_HDR_H;

    // ── Special service badge ──────────────────────────────────────────────
    if (isSpecial && group.servicio) {
        ctx.fillStyle = uStyle.accentColor;
        ctx.fillRect(x, cy, L.CELL_W, L.BADGE_H);
        ctx.fillStyle = '#ffffff';
        ctx.font = L.F_BADGE;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            fitText(ctx, group.servicio.toUpperCase(), L.CELL_W - Math.round(8 * 3)),
            x + L.CELL_W / 2,
            cy + L.BADGE_H / 2
        );
        ctx.textAlign = 'left';
        cy += L.BADGE_H;
    }

    cy += L.CELL_PAD;
    const bx = x + L.CELL_PAD; // body left edge

    // ── Encargado row ──────────────────────────────────────────────────────
    if (group.encargado) {
        // tinted background strip
        ctx.fillStyle = uStyle.accentColor + '18';
        ctx.fillRect(x, cy, L.CELL_W, L.ENCAR_H);

        ctx.font = L.F_ENCAR;
        ctx.textBaseline = 'middle';
        const midY = cy + L.ENCAR_H / 2;

        // "ENCAR:" label
        ctx.fillStyle = uStyle.accentColor;
        ctx.fillText('ENCAR:', bx, midY);
        const labelW = ctx.measureText('ENCAR:').width + Math.round(4 * 3);

        // Name
        ctx.fillStyle = '#0f172a';
        const nameW = L.CELL_W - L.CELL_PAD * 2 - labelW;
        ctx.fillText(fitText(ctx, group.encargado, nameW), bx + labelW, midY);

        // bottom separator
        ctx.strokeStyle = uStyle.accentColor + '30';
        ctx.lineWidth = Math.round(0.8 * 3);
        ctx.beginPath();
        ctx.moveTo(bx, cy + L.ENCAR_H - 0.5);
        ctx.lineTo(x + L.CELL_W - L.CELL_PAD, cy + L.ENCAR_H - 0.5);
        ctx.stroke();

        cy += L.ENCAR_H;
    }

    // ── Server rows ────────────────────────────────────────────────────────
    for (let i = 0; i < servers.length; i++) {
        const sv = servers[i];
        const rowY = cy + i * L.ROW_H;
        const midY = rowY + L.ROW_H / 2;

        // Alternate row tint
        if (i % 2 === 0) {
            ctx.fillStyle = '#00000008';
            ctx.fillRect(x, rowY, L.CELL_W, L.ROW_H);
        }

        // Position label
        ctx.font = L.F_POS;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = uStyle.accentColor;
        const posLabel = abbreviatePos(sv.posicion);
        ctx.fillText(posLabel, bx, midY);

        // Name
        ctx.font = L.F_NAME;
        ctx.fillStyle = '#1e293b';
        const availW = L.CELL_W - L.CELL_PAD * 2 - L.POS_W;
        ctx.fillText(
            fitText(ctx, sv.nombre || '', availW),
            bx + L.POS_W,
            midY
        );
    }
}

// ─── Main draw function ───────────────────────────────────────────────────────

function drawCalendar(
    ctx: CanvasRenderingContext2D,
    groupedAssignments: Record<string, any>,
    departmentName: string,
    S: number
): number {
    const L = makeLayout(S);
    const dates = Object.keys(groupedAssignments).sort();
    if (dates.length === 0) return 0;

    const usedDowSet = new Set(dates.map(d => dayjs(d).day()));
    const usedDow = [...usedDowSet].sort((a, b) => DAY_ORDER(a) - DAY_ORDER(b));
    const numCols = usedDow.length;
    const GRID_W = numCols * L.CELL_W + (numCols - 1) * L.GAP;

    const weekMap = new Map<string, Set<string>>();
    for (const d of dates) {
        const monday = getMondayOfWeek(d);
        if (!weekMap.has(monday)) weekMap.set(monday, new Set());
        weekMap.get(monday)!.add(d);
    }
    const sortedWeeks = [...weekMap.keys()].sort();

    // ── Title ──────────────────────────────────────────────────────────────
    const titleY = L.PAD;
    drawRoundRect(ctx, L.PAD, titleY, GRID_W, L.TITLE_H, L.RADIUS, '#fffbeb', '#d97706', Math.round(2.5 * S));

    const monthLabel = dayjs(dates[0]).format('MMMM YYYY').toUpperCase();
    ctx.font = L.F_TITLE;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ROL DE ${monthLabel}`, L.PAD + GRID_W / 2, titleY + L.TITLE_H * (departmentName ? 0.36 : 0.5));

    if (departmentName) {
        ctx.font = L.F_DEPT;
        ctx.fillStyle = '#d97706';
        ctx.fillText(departmentName.toUpperCase(), L.PAD + GRID_W / 2, titleY + L.TITLE_H * 0.70);
    }
    ctx.textAlign = 'left';

    let y = titleY + L.TITLE_H + L.GAP * 2;

    // ── Day-of-week column headers ─────────────────────────────────────────
    for (let i = 0; i < numCols; i++) {
        const x = L.PAD + i * (L.CELL_W + L.GAP);
        drawRoundRect(ctx, x, y, L.CELL_W, L.DAY_HDR_H, L.RADIUS, '#0f172a');
        ctx.font = L.F_DAY_HDR;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(DAY_NAMES[usedDow[i]], x + L.CELL_W / 2, y + L.DAY_HDR_H / 2);
    }
    ctx.textAlign = 'left';
    y += L.DAY_HDR_H + L.GAP;

    // ── Week rows ──────────────────────────────────────────────────────────
    for (const monday of sortedWeeks) {
        // Measure max height for this row
        let maxCellH = Math.round(40 * S); // minimum row height
        for (const dow of usedDow) {
            const daysFromMonday = dow === 0 ? 6 : dow - 1;
            const cellDateStr = dayjs(monday).add(daysFromMonday, 'day').format('YYYY-MM-DD');
            const group = groupedAssignments[cellDateStr];
            if (!group) continue;
            const h = calcCellHeight(group, L);
            if (h > maxCellH) maxCellH = h;
        }

        // Draw cells
        for (let i = 0; i < numCols; i++) {
            const dow = usedDow[i];
            const daysFromMonday = dow === 0 ? 6 : dow - 1;
            const cellDateStr = dayjs(monday).add(daysFromMonday, 'day').format('YYYY-MM-DD');
            const group = groupedAssignments[cellDateStr];
            if (!group) continue;

            const x = L.PAD + i * (L.CELL_W + L.GAP);
            // Attach helpers to group so drawCell can use them
            group._dayNum = dayjs(cellDateStr).date();
            group._dateStr = cellDateStr;

            drawCell(ctx, x, y, maxCellH, group, L);
        }
        y += maxCellH + L.GAP;
    }

    // ── Footer ─────────────────────────────────────────────────────────────
    y += L.GAP * 2;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = Math.round(S);
    ctx.beginPath();
    ctx.moveTo(L.PAD, y);
    ctx.lineTo(L.PAD + GRID_W, y);
    ctx.stroke();
    y += Math.round(8 * S);

    ctx.font = L.F_FOOTER;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
        `REPORTE OFICIAL  •  GENERADO EL ${dayjs().format('DD/MM/YYYY HH:mm')}  •  © UJIERES APP SYSTEM`,
        L.PAD + GRID_W / 2, y
    );
    ctx.textAlign = 'left';

    return y + Math.round(22 * S) + L.PAD;
}

// ─── Two-pass size measurement ────────────────────────────────────────────────

function measureSize(groupedAssignments: Record<string, any>, S: number): { width: number; height: number } {
    const L = makeLayout(S);
    const dates = Object.keys(groupedAssignments).sort();
    if (dates.length === 0) return { width: 900, height: 400 };

    const usedDowSet = new Set(dates.map(d => dayjs(d).day()));
    const usedDow = [...usedDowSet].sort((a, b) => DAY_ORDER(a) - DAY_ORDER(b));
    const numCols = usedDow.length;
    const GRID_W = numCols * L.CELL_W + (numCols - 1) * L.GAP;

    const weekMap = new Map<string, Set<string>>();
    for (const d of dates) {
        const monday = getMondayOfWeek(d);
        if (!weekMap.has(monday)) weekMap.set(monday, new Set());
        weekMap.get(monday)!.add(d);
    }

    let totalH = L.PAD + L.TITLE_H + L.GAP * 2 + L.DAY_HDR_H + L.GAP;

    for (const monday of weekMap.keys()) {
        let maxCellH = Math.round(40 * S);
        for (const dow of usedDow) {
            const daysFromMonday = dow === 0 ? 6 : dow - 1;
            const cellDateStr = dayjs(monday).add(daysFromMonday, 'day').format('YYYY-MM-DD');
            const group = groupedAssignments[cellDateStr];
            if (!group) continue;
            const h = calcCellHeight(group, L);
            if (h > maxCellH) maxCellH = h;
        }
        totalH += maxCellH + L.GAP;
    }

    totalH += L.GAP * 2 + Math.round(8 * S) + Math.round(22 * S) + L.PAD;
    return { width: GRID_W + L.PAD * 2, height: totalH };
}

// ─── Public API ───────────────────────────────────────────────────────────────

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
        const S = 3; // 3× pixel ratio → crisp on any screen
        const { width, height } = measureSize(groupedAssignments, S);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#f8fafc';
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
