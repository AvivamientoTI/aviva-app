import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { notify } from '../../../utils/notificationsHelper';

dayjs.locale('es');

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
        return { headerBg: '#6d28d9', headerText: '#fff', cellBg: '#ede9fe', accentColor: '#5b21b6', label: 'CULTO NIÑOS' };
    if (s.includes('matrimoni') || s.includes('boda'))
        return { headerBg: '#0369a1', headerText: '#fff', cellBg: '#e0f2fe', accentColor: '#0284c7', label: 'MATRIMONIO' };
    if (s.includes('formac') || s.includes('capacit'))
        return { headerBg: '#047857', headerText: '#fff', cellBg: '#d1fae5', accentColor: '#065f46', label: 'FORMACIÓN' };
    if (s.includes('especial') || s.includes('aniversar'))
        return { headerBg: '#b45309', headerText: '#fff', cellBg: '#fef3c7', accentColor: '#92400e', label: 'ESPECIAL' };
    if (u.includes('azul'))
        return { headerBg: '#1d4ed8', headerText: '#fff', cellBg: '#dbeafe', accentColor: '#1e40af', label: 'CAMISA AZUL' };
    if (u.includes('vino') || u.includes('rojo') || u.includes('bordo'))
        return { headerBg: '#9f1239', headerText: '#fff', cellBg: '#ffe4e6', accentColor: '#881337', label: 'CAMISA VINO' };
    if (u.includes('gris'))
        return { headerBg: '#334155', headerText: '#fff', cellBg: '#f1f5f9', accentColor: '#1e293b', label: 'UNI GRIS' };
    if (u.includes('beige') || u.includes('crema'))
        return { headerBg: '#92400e', headerText: '#fff', cellBg: '#fefce8', accentColor: '#78350f', label: 'CAMISA BEIGE' };
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
    if (p.includes('ALTAR D') || p.includes('PLATAFORMA')) return 'ALT.D';
    if (p.includes('ALTAR IZ')) return 'ALT.IZ';
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
    return p.length > 8 ? p.substring(0, 7) + '.' : p;
}

/** Truncate text so it fits within maxPx, appending ellipsis */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxPx: number): string {
    if (!text) return '';
    if (ctx.measureText(text).width <= maxPx) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxPx) t = t.slice(0, -1);
    return t + '…';
}

function isSpecialService(servicio: string): boolean {
    return ['niño', 'matrimoni', 'formac', 'especial', 'aniversar', 'infantil']
        .some(k => (servicio || '').toLowerCase().includes(k));
}

/** Returns true if this server IS the encargado (to avoid double-listing) */
function isEncargadoRow(sv: any, encargadoName: string): boolean {
    if (!encargadoName) return false;
    const pos = (sv.posicion || '').toUpperCase();
    if (pos.includes('ENCARGAD')) return true;
    // Also match by name similarity
    const name = (sv.nombre || '').toLowerCase().trim();
    const encar = encargadoName.toLowerCase().trim();
    return name === encar || encar.includes(name) || name.includes(encar);
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function drawRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    r: number, fill: string, stroke?: string, strokeW = 1
) {
    r = Math.min(r, w / 2, h / 2);
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
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeW; ctx.stroke(); }
}

/** Rounded top, straight bottom */
function drawTopRounded(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number, fill: string
) {
    r = Math.min(r, w / 2, h / 2);
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

/** Circle badge */
function drawCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
}

// ─── Scale-based layout ───────────────────────────────────────────────────────

// S is the base scale multiplier (e.g. 3 for 3× resolution)
// Base sizes are in "virtual px" designed for ~220px wide cells at 1×

const BASE = {
    PAD: 20,
    GAP: 8,           // gap between cells
    CELL_W: 220,
    TITLE_H: 64,
    DAY_HDR_H: 32,
    CELL_HDR_H: 34,   // header bar height
    DATE_BADGE_R: 14, // radius of the date number circle
    BADGE_H: 18,      // special service sub-badge
    ENCAR_H: 22,      // encargado strip height
    ROW_H: 20,        // server row height
    CELL_PAD_X: 8,    // horizontal padding inside cell body
    CELL_PAD_TOP: 6,  // top padding in body
    POS_W: 56,        // width reserved for position label
};

function sc(val: number, S: number) { return Math.round(val * S); }

// ─── Cell height ──────────────────────────────────────────────────────────────

function calcCellHeight(group: any, S: number): number {
    const isSpecial = isSpecialService(group.servicio);
    const encargado: string = group.encargado || '';
    const servers: any[] = (group.assignments || []).filter((sv: any) => !isEncargadoRow(sv, encargado));
    return sc(BASE.CELL_HDR_H, S)
        + (isSpecial && group.servicio ? sc(BASE.BADGE_H, S) : 0)
        + sc(BASE.ENCAR_H, S)          // always reserve encargado row
        + servers.length * sc(BASE.ROW_H, S)
        + sc(BASE.CELL_PAD_TOP, S)
        + sc(6, S);                    // bottom padding
}

// ─── Draw one cell ────────────────────────────────────────────────────────────

function drawCell(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    cellH: number,
    group: any,
    S: number
) {
    const uStyle = getUniformStyle(group.uniforme, group.servicio);
    const isSpecial = isSpecialService(group.servicio);
    const encargado: string = group.encargado || '';
    const allServers: any[] = group.assignments || [];
    // Remove the encargado entry from the list to avoid duplication
    const servers = allServers.filter((sv: any) => !isEncargadoRow(sv, encargado));
    const dayNum: number = group._dayNum;

    const CELL_W = sc(BASE.CELL_W, S);
    const HDR_H  = sc(BASE.CELL_HDR_H, S);
    const R      = sc(6, S);
    const BADGE_R = sc(BASE.DATE_BADGE_R, S);
    const PX     = sc(BASE.CELL_PAD_X, S);
    const POS_W  = sc(BASE.POS_W, S);
    const ROW_H  = sc(BASE.ROW_H, S);
    const ENCAR_H = sc(BASE.ENCAR_H, S);

    // ── Shadow / outer card ────────────────────────────────────────────────
    // Light drop-shadow simulation: draw slightly larger gray rect behind
    ctx.fillStyle = '#00000018';
    drawRoundRect(ctx, x + sc(2, S), y + sc(2, S), CELL_W, cellH, R, '#00000018');

    // ── Card background ────────────────────────────────────────────────────
    drawRoundRect(ctx, x, y, CELL_W, cellH, R, uStyle.cellBg, uStyle.accentColor + '50', Math.round(1.5 * S));

    // ── Header bar ─────────────────────────────────────────────────────────
    drawTopRounded(ctx, x, y, CELL_W, HDR_H, R, uStyle.headerBg);

    // Uniform name — left-aligned, with space for date badge on the right
    const BADGE_AREA = BADGE_R * 2 + sc(10, S); // space reserved for badge
    ctx.font = `900 ${sc(11, S)}px Arial,Helvetica,sans-serif`;
    ctx.fillStyle = uStyle.headerText;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const midHdr = y + HDR_H / 2;
    ctx.fillText(
        fitText(ctx, uStyle.label, CELL_W - BADGE_AREA - sc(14, S)),
        x + PX,
        midHdr
    );

    // Date badge — circle on the right side of the header
    const badgeCX = x + CELL_W - BADGE_R - sc(6, S);
    const badgeCY = y + HDR_H / 2;
    drawCircle(ctx, badgeCX, badgeCY, BADGE_R, 'rgba(255,255,255,0.25)');
    ctx.font = `900 ${sc(12, S)}px Arial,Helvetica,sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(dayNum), badgeCX, badgeCY);
    ctx.textAlign = 'left';

    let cy = y + HDR_H;

    // ── Special service sub-badge ──────────────────────────────────────────
    if (isSpecial && group.servicio) {
        const BH = sc(BASE.BADGE_H, S);
        ctx.fillStyle = uStyle.accentColor;
        ctx.fillRect(x, cy, CELL_W, BH);
        ctx.font = `800 ${sc(9, S)}px Arial,Helvetica,sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fitText(ctx, group.servicio.toUpperCase(), CELL_W - PX * 2), x + CELL_W / 2, cy + BH / 2);
        ctx.textAlign = 'left';
        cy += BH;
    }

    cy += sc(BASE.CELL_PAD_TOP, S);

    // ── Encargado row ──────────────────────────────────────────────────────
    // Always draw the strip (even if empty) to keep layout consistent
    {
        const EH = ENCAR_H;
        // Tinted strip
        ctx.fillStyle = uStyle.accentColor + '22';
        ctx.fillRect(x, cy, CELL_W, EH);

        // Left accent bar
        ctx.fillStyle = uStyle.accentColor;
        ctx.fillRect(x, cy, sc(3, S), EH);

        ctx.font = `700 ${sc(9, S)}px Arial,Helvetica,sans-serif`;
        ctx.textBaseline = 'middle';
        const midE = cy + EH / 2;

        if (encargado) {
            // Label
            ctx.fillStyle = uStyle.accentColor;
            ctx.fillText('ENCARGADO:', x + PX + sc(3, S), midE);
            const labelW = ctx.measureText('ENCARGADO:').width + sc(5, S);
            // Name
            ctx.fillStyle = '#0f172a';
            ctx.font = `600 ${sc(9, S)}px Arial,Helvetica,sans-serif`;
            ctx.fillText(
                fitText(ctx, encargado, CELL_W - PX * 2 - sc(3, S) - labelW),
                x + PX + sc(3, S) + labelW,
                midE
            );
        } else {
            ctx.fillStyle = '#94a3b8';
            ctx.font = `400 italic ${sc(8.5, S)}px Arial,Helvetica,sans-serif`;
            ctx.fillText('Sin encargado asignado', x + PX + sc(6, S), midE);
        }

        // Separator line
        ctx.strokeStyle = uStyle.accentColor + '35';
        ctx.lineWidth = Math.round(S * 0.8);
        ctx.beginPath();
        ctx.moveTo(x + PX, cy + EH);
        ctx.lineTo(x + CELL_W - PX, cy + EH);
        ctx.stroke();

        cy += EH;
    }

    // ── Server rows ────────────────────────────────────────────────────────
    for (let i = 0; i < servers.length; i++) {
        const sv = servers[i];
        const rowY = cy + i * ROW_H;
        const midY = rowY + ROW_H / 2;

        // Zebra stripe
        if (i % 2 === 0) {
            ctx.fillStyle = '#0000000A';
            ctx.fillRect(x, rowY, CELL_W, ROW_H);
        }

        // Position label — bold, accent color
        ctx.font = `700 ${sc(9, S)}px Arial,Helvetica,sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = uStyle.accentColor;
        ctx.fillText(abbreviatePos(sv.posicion), x + PX, midY);

        // Separator dot
        ctx.fillStyle = '#cbd5e1';
        drawCircle(ctx, x + PX + POS_W - sc(6, S), midY, sc(1.5, S), '#cbd5e1');

        // Name — regular weight, dark
        ctx.font = `400 ${sc(10, S)}px Arial,Helvetica,sans-serif`;
        ctx.fillStyle = '#1e293b';
        const availW = CELL_W - PX * 2 - POS_W;
        ctx.fillText(fitText(ctx, sv.nombre || '', availW), x + PX + POS_W, midY);
    }
}

// ─── Measure canvas size (no drawing) ────────────────────────────────────────

function measureSize(groupedAssignments: Record<string, any>, S: number): { width: number; height: number } {
    const PAD = sc(BASE.PAD, S);
    const GAP = sc(BASE.GAP, S);
    const CELL_W = sc(BASE.CELL_W, S);

    const dates = Object.keys(groupedAssignments).sort();
    if (dates.length === 0) return { width: 900, height: 400 };

    const usedDow = [...new Set(dates.map(d => dayjs(d).day()))].sort((a, b) => DAY_ORDER(a) - DAY_ORDER(b));
    const numCols = usedDow.length;
    const GRID_W = numCols * CELL_W + (numCols - 1) * GAP;

    const weekMap = new Map<string, Set<string>>();
    for (const d of dates) {
        const m = getMondayOfWeek(d);
        if (!weekMap.has(m)) weekMap.set(m, new Set());
        weekMap.get(m)!.add(d);
    }

    let totalH = PAD + sc(BASE.TITLE_H, S) + GAP * 2 + sc(BASE.DAY_HDR_H, S) + GAP;

    for (const monday of weekMap.keys()) {
        let maxH = sc(60, S);
        for (const dow of usedDow) {
            const dfm = dow === 0 ? 6 : dow - 1;
            const dt = dayjs(monday).add(dfm, 'day').format('YYYY-MM-DD');
            const group = groupedAssignments[dt];
            if (!group) continue;
            const h = calcCellHeight(group, S);
            if (h > maxH) maxH = h;
        }
        totalH += maxH + GAP;
    }

    totalH += GAP * 3 + sc(28, S) + PAD; // footer
    return { width: GRID_W + PAD * 2, height: totalH };
}

// ─── Full render ──────────────────────────────────────────────────────────────

function drawCalendar(
    ctx: CanvasRenderingContext2D,
    groupedAssignments: Record<string, any>,
    departmentName: string,
    S: number
) {
    const PAD = sc(BASE.PAD, S);
    const GAP = sc(BASE.GAP, S);
    const CELL_W = sc(BASE.CELL_W, S);
    const R = sc(6, S);

    const dates = Object.keys(groupedAssignments).sort();
    const usedDow = [...new Set(dates.map(d => dayjs(d).day()))].sort((a, b) => DAY_ORDER(a) - DAY_ORDER(b));
    const numCols = usedDow.length;
    const GRID_W = numCols * CELL_W + (numCols - 1) * GAP;

    const weekMap = new Map<string, Set<string>>();
    for (const d of dates) {
        const m = getMondayOfWeek(d);
        if (!weekMap.has(m)) weekMap.set(m, new Set());
        weekMap.get(m)!.add(d);
    }
    const sortedWeeks = [...weekMap.keys()].sort();

    // ── Title ──────────────────────────────────────────────────────────────
    const TITLE_H = sc(BASE.TITLE_H, S);
    const tY = PAD;
    drawRoundRect(ctx, PAD, tY, GRID_W, TITLE_H, R, '#fffbeb', '#d97706', sc(3, S));

    // Gold left stripe
    ctx.fillStyle = '#d97706';
    ctx.fillRect(PAD, tY, sc(5, S), TITLE_H);

    const monthLabel = dayjs(dates[0]).format('MMMM YYYY').toUpperCase();
    ctx.font = `900 ${sc(24, S)}px Arial,Helvetica,sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ROL DE ${monthLabel}`, PAD + GRID_W / 2, tY + TITLE_H * (departmentName ? 0.37 : 0.5));

    if (departmentName) {
        ctx.font = `700 ${sc(12, S)}px Arial,Helvetica,sans-serif`;
        ctx.fillStyle = '#d97706';
        ctx.fillText(departmentName.toUpperCase(), PAD + GRID_W / 2, tY + TITLE_H * 0.70);
    }
    ctx.textAlign = 'left';

    let y = tY + TITLE_H + GAP * 2;

    // ── Day-of-week headers ────────────────────────────────────────────────
    const DHH = sc(BASE.DAY_HDR_H, S);
    for (let i = 0; i < numCols; i++) {
        const x = PAD + i * (CELL_W + GAP);
        drawRoundRect(ctx, x, y, CELL_W, DHH, R, '#0f172a');
        ctx.font = `900 ${sc(12, S)}px Arial,Helvetica,sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(DAY_NAMES[usedDow[i]], x + CELL_W / 2, y + DHH / 2);
    }
    ctx.textAlign = 'left';
    y += DHH + GAP;

    // ── Week rows ──────────────────────────────────────────────────────────
    for (const monday of sortedWeeks) {
        let maxH = sc(60, S);
        for (const dow of usedDow) {
            const dfm = dow === 0 ? 6 : dow - 1;
            const dt = dayjs(monday).add(dfm, 'day').format('YYYY-MM-DD');
            const group = groupedAssignments[dt];
            if (!group) continue;
            const h = calcCellHeight(group, S);
            if (h > maxH) maxH = h;
        }

        for (let i = 0; i < numCols; i++) {
            const dow = usedDow[i];
            const dfm = dow === 0 ? 6 : dow - 1;
            const dt = dayjs(monday).add(dfm, 'day').format('YYYY-MM-DD');
            const group = groupedAssignments[dt];
            const x = PAD + i * (CELL_W + GAP);

            if (!group) {
                // Empty day placeholder – subtle dashed border
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = Math.round(S);
                ctx.setLineDash([sc(4, S), sc(4, S)]);
                drawRoundRect(ctx, x, y, CELL_W, maxH, R, 'transparent');
                // Re-draw as stroke only
                ctx.beginPath();
                ctx.roundRect?.(x, y, CELL_W, maxH, R);
                ctx.stroke();
                ctx.setLineDash([]);
                continue;
            }

            group._dayNum = dayjs(dt).date();
            drawCell(ctx, x, y, maxH, group, S);
        }

        y += maxH + GAP;
    }

    // ── Footer ─────────────────────────────────────────────────────────────
    y += GAP * 2;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = Math.round(S);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(PAD + GRID_W, y);
    ctx.stroke();
    y += sc(8, S);

    ctx.font = `400 ${sc(8, S)}px Arial,Helvetica,sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
        `REPORTE OFICIAL  •  GENERADO EL ${dayjs().format('DD/MM/YYYY HH:mm')}  •  © UJIERES APP SYSTEM`,
        PAD + GRID_W / 2, y
    );
    ctx.textAlign = 'left';
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
        const S = 3;
        const { width, height } = measureSize(groupedAssignments, S);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;
        // Subtle grid background
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, width, height);

        drawCalendar(ctx, groupedAssignments, departmentName, S);

        const dateLabel = dayjs(dates.sort()[0]).format('MMMM_YYYY').toUpperCase();
        const fileName = `Rol_Servicios_${dateLabel}.jpg`;

        await new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) { notify.error('Error al generar la imagen.'); resolve(); return; }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 200);
                notify.success('Imagen generada exitosamente', '¡Éxito!');
                resolve();
            }, 'image/jpeg', 0.95);
        });

    } catch (err: any) {
        console.error('Calendar image export error:', err);
        notify.error('Error al generar la imagen del calendario.');
    }
}
