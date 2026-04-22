/**
 * Calendar image export — replicates the compact weekly-grid format:
 *
 *  ┌─────────────────── ROL DE ABRIL ────────────────────┐
 *  │ MARTES 07  │ MIERCOLES 08 │ VIERNES 10 │ SABADO 11  │  ← mini-header per week
 *  │ CAMISA AZUL│   VARONES    │    ...     │  UNI FORMAL │  ← cells fill full width
 *  │ MARTES 14  │ MIERCOLES 15 │ JUEVES 16  │ VIERNES 17  │
 *  │   ...      │     ...      │    ...     │    ...      │
 *  └─────────────────────────────────────────────────────┘
 *
 * Drawn entirely with Canvas 2D API — no DOM capture, no blank-image risk.
 */
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { notify } from '../../../utils/notificationsHelper';

dayjs.locale('es');

const isMobile = () =>
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;

// ─── Day helpers ──────────────────────────────────────────────────────────────

const DAY_SHORT: Record<number, string> = {
    0: 'DOMINGO', 1: 'LUNES', 2: 'MARTES', 3: 'MIERCOLES',
    4: 'JUEVES',  5: 'VIERNES', 6: 'SABADO',
};

function getMondayOfWeek(dateStr: string): string {
    const d = dayjs(dateStr);
    const dow = d.day();
    return d.subtract(dow === 0 ? 6 : dow - 1, 'day').format('YYYY-MM-DD');
}

// ─── Uniform styles ───────────────────────────────────────────────────────────

interface UStyle { bg: string; cellBg: string; accent: string; label: string; }

function uStyle(uniforme: string, servicio: string): UStyle {
    const u = (uniforme || '').toLowerCase();
    const s = (servicio || '').toLowerCase();
    if (s.includes('niño') || s.includes('infantil') || s.includes('kids'))
        return { bg: '#6d28d9', cellBg: '#ede9fe', accent: '#5b21b6', label: 'CULTO NIÑOS' };
    if (s.includes('matrimoni') || s.includes('boda'))
        return { bg: '#0369a1', cellBg: '#e0f2fe', accent: '#0284c7', label: 'MATRIMONIOS' };
    if (s.includes('formac') || s.includes('capacit'))
        return { bg: '#047857', cellBg: '#d1fae5', accent: '#065f46', label: 'FORMACION' };
    if (s.includes('especial') || s.includes('aniversar'))
        return { bg: '#b45309', cellBg: '#fef3c7', accent: '#92400e', label: 'ESPECIAL' };
    if (u.includes('azul'))
        return { bg: '#1d4ed8', cellBg: '#dbeafe', accent: '#1e40af', label: 'CAMISA AZUL' };
    if (u.includes('vino') || u.includes('rojo') || u.includes('bordo'))
        return { bg: '#9f1239', cellBg: '#ffe4e6', accent: '#881337', label: 'CAMISA VINO' };
    if (u.includes('gris'))
        return { bg: '#334155', cellBg: '#f1f5f9', accent: '#1e293b', label: 'UNI FORMAL GRIS' };
    if (u.includes('beige') || u.includes('crema'))
        return { bg: '#92400e', cellBg: '#fefce8', accent: '#78350f', label: 'CAMISA BEIGE' };
    if (u.includes('blanca') || u.includes('blanco'))
        return { bg: '#374151', cellBg: '#f8fafc', accent: '#334155', label: 'CAMISA BLANCA' };
    if (u.includes('negra') || u.includes('negro'))
        return { bg: '#111827', cellBg: '#e5e7eb', accent: '#1f2937', label: 'CAMISA NEGRA' };
    if (u.includes('formal'))
        return { bg: '#b45309', cellBg: '#fef3c7', accent: '#92400e', label: 'UNI FORMAL' };
    if (u.includes('varon') || u.includes('hombre'))
        return { bg: '#1e40af', cellBg: '#dbeafe', accent: '#1d4ed8', label: 'VARONES' };
    return { bg: '#374151', cellBg: '#f3f4f6', accent: '#1f2937', label: uniforme || 'SERVICIO' };
}

// ─── Position abbreviation ────────────────────────────────────────────────────

function abbrev(pos: string): string {
    if (!pos) return '';
    const p = pos.toUpperCase();
    if (p.includes('ENCARGAD'))                        return 'ENCAR';
    if (p.includes('CARRO') || p.includes('PARQUEO'))  return 'CARRO';
    if (p.includes('PUERTA') || p.includes('ENTRAD'))  return 'PUERTA';
    if (p.includes('ALTAR D') || p.includes('PLATAF')) return 'ALTAR D';
    if (p.includes('ALTAR IZ'))                        return 'ALTAR IZ';
    if (p.includes('ALTAR'))                           return 'ALTAR';
    if (p.includes('BAÑO') || p.includes('BANO'))      return 'BAÑOS';
    if (p.includes('NIÑO') || p.includes('INFANTIL'))  return 'NIÑOS';
    if (p.includes('SERVIR') || p.includes('SERVID'))  return 'SERV';
    if (p.includes('LIBRE'))                           return 'LIBRE';
    if (p.includes('SONIDO') || p.includes('SOUND'))   return 'AUDIO';
    if (p.includes('USHER'))                           return 'USHER';
    if (p.includes('AYUD'))                            return 'AYUD';
    if (p.includes('ACOMOD'))                          return 'ACOM';
    return p.length > 8 ? p.slice(0, 7) + '.' : p;
}

/** Is this server the encargado? (filter from regular rows to avoid duplication) */
function isEncargado(sv: any, encarName: string): boolean {
    const pos = (sv.posicion || '').toUpperCase();
    if (pos.includes('ENCARGAD')) return true;
    if (!encarName) return false;
    const a = (sv.nombre || '').toLowerCase().trim();
    const b = encarName.toLowerCase().trim();
    return a === b || b.includes(a) || a.includes(b);
}

// ─── Text helpers ─────────────────────────────────────────────────────────────

function fit(ctx: CanvasRenderingContext2D, text: string, maxPx: number): string {
    if (!text) return '';
    if (ctx.measureText(text).width <= maxPx) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxPx) t = t.slice(0, -1);
    return t + '…';
}

/** Solo primer nombre + primer apellido (ej. "María González") */
function shortName(fullName: string): string {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0] ?? '';
}

// ─── Rounded rect helpers ─────────────────────────────────────────────────────

function fillRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
                r: number, fill: string) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
}

function strokeRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
                  r: number, stroke: string, lw: number) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
}

// Top-only rounded corners
function fillTopRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
                   r: number, fill: string) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
}

// ─── Layout constants (virtual px at 1×, multiply by S for actual pixels) ─────

const L = {
    PAD:        14,   // outer canvas padding
    GAP:         3,   // gap between cells in a week row
    WEEK_GAP:    8,   // gap between week sections
    GRID_W:    690,   // fixed grid width (fills equally per week)
    TITLE_H:    48,   // title block
    WEEK_HDR_H: 18,   // per-week mini header (shows "MARTES 07")
    CELL_HDR_H: 16,   // cell uniform/service name bar
    ROW_H:      12,   // height of each body row (encar + server rows)
    PX:          5,   // horizontal padding inside cell body
    POS_W:      40,   // width of position label column
    R:           4,   // border radius
};

function px(v: number, S: number) { return Math.round(v * S); }

// ─── Cell row count ────────────────────────────────────────────────────────────

function rowCount(group: any): number {
    const enc = group.encargado ? 1 : 0;
    const srvs = (group.assignments || []).filter((sv: any) => !isEncargado(sv, group.encargado || '')).length;
    return enc + srvs + 1; // +1 row reservada para el uniforme al pie
}

// ─── Build week/column maps ────────────────────────────────────────────────────

function buildWeekStructure(grouped: Record<string, any>) {
    const dates = Object.keys(grouped).sort();

    // Fixed column set: union of all days-of-week in the dataset, Mon→Sun order
    const dowSet = new Set(dates.map(d => dayjs(d).day()));
    const allDows = [...dowSet].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));

    // Group dates by week (monday key)
    const weekMap = new Map<string, string[]>();
    for (const d of dates) {
        const m = getMondayOfWeek(d);
        if (!weekMap.has(m)) weekMap.set(m, []);
        weekMap.get(m)!.push(d);
    }
    const weeks = [...weekMap.keys()].sort().map(m => weekMap.get(m)!.sort());

    return { allDows, weeks };
}

// ─── Full render ──────────────────────────────────────────────────────────────

function render(ctx: CanvasRenderingContext2D, grouped: Record<string, any>, dept: string, S: number) {
    const PAD    = px(L.PAD, S);
    const GRID_W = px(L.GRID_W, S);
    const WGAP   = px(L.WEEK_GAP, S);
    const GAP    = px(L.GAP, S);
    const R      = px(L.R, S);
    const gridX  = PAD;

    const dates = Object.keys(grouped).sort();
    const { allDows, weeks } = buildWeekStructure(grouped);
    const N      = allDows.length;
    // Fixed cell width — same for ALL weeks so columns align vertically
    const cellW  = Math.floor((GRID_W - GAP * (N - 1)) / N);

    // ── Title ──────────────────────────────────────────────────────────────
    const TH = px(L.TITLE_H, S);
    let y = PAD;

    fillRR(ctx, gridX, y, GRID_W, TH, R, '#fffbeb');
    strokeRR(ctx, gridX, y, GRID_W, TH, R, '#d97706', px(2.5, S));
    ctx.fillStyle = '#d97706';
    ctx.fillRect(gridX, y, px(4, S), TH);

    const monthLabel = dayjs(dates[0]).format('MMMM YYYY').toUpperCase();
    ctx.font = `900 ${px(21, S)}px Arial,Helvetica,sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ROL DE ${monthLabel}`, gridX + GRID_W / 2, y + TH * (dept ? 0.35 : 0.5));

    if (dept) {
        ctx.font = `700 ${px(10, S)}px Arial,Helvetica,sans-serif`;
        ctx.fillStyle = '#d97706';
        ctx.fillText(dept.toUpperCase(), gridX + GRID_W / 2, y + TH * 0.70);
    }
    ctx.textAlign = 'left';

    y += TH + WGAP;

    // ── Week sections ──────────────────────────────────────────────────────
    for (const days of weeks) {
        // Build a map: dow → dateStr for this week
        const dowToDate = new Map<number, string>();
        for (const d of days) dowToDate.set(dayjs(d).day(), d);

        // Max rows across all columns in this week
        const maxRows = Math.max(1, ...allDows.map(dow => {
            const dt = dowToDate.get(dow);
            return dt && grouped[dt] ? rowCount(grouped[dt]) : 0;
        }));

        const WHH         = px(L.WEEK_HDR_H, S);
        const CHH         = px(L.CELL_HDR_H, S);
        const cellBodyH   = maxRows * px(L.ROW_H, S) + px(4, S);
        const cellTotalH  = CHH + cellBodyH;

        for (let i = 0; i < N; i++) {
            const dow     = allDows[i];
            const dateStr = dowToDate.get(dow);
            const x       = gridX + i * (cellW + GAP);
            const dayNum  = dateStr ? dayjs(dateStr).date() : null;

            // ── Mini day header ──────────────────────────────────────────
            if (dayNum !== null) {
                fillRR(ctx, x, y, cellW, WHH, px(L.R, S), '#0f172a');
                ctx.font = `900 ${px(9, S)}px Arial,Helvetica,sans-serif`;
                ctx.fillStyle = '#ffffff';
            } else {
                // Dim header for empty column
                fillRR(ctx, x, y, cellW, WHH, px(L.R, S), '#e2e8f0');
                ctx.font = `700 ${px(9, S)}px Arial,Helvetica,sans-serif`;
                ctx.fillStyle = '#94a3b8';
            }
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const label = dayNum !== null
                ? `${DAY_SHORT[dow]} ${String(dayNum).padStart(2, '0')}`
                : DAY_SHORT[dow];
            ctx.fillText(label, x + cellW / 2, y + WHH / 2);

            // ── Cell ────────────────────────────────────────────────────
            if (!dateStr || !grouped[dateStr]) continue;

            const group  = grouped[dateStr];
            const cellY  = y + WHH + GAP;
            const us     = uStyle(group.uniforme, group.servicio);
            const encargado: string = group.encargado || '';
            const servers = (group.assignments || []).filter((sv: any) => !isEncargado(sv, encargado));

            // Shadow
            ctx.fillStyle = '#0000001A';
            fillRR(ctx, x + px(1, S), cellY + px(1, S), cellW, cellTotalH, px(L.R, S), '#0000001A');
            // Body bg + border
            fillRR(ctx, x, cellY, cellW, cellTotalH, px(L.R, S), us.cellBg);
            strokeRR(ctx, x, cellY, cellW, cellTotalH, px(L.R, S), us.accent + '70', Math.round(S * 0.8));

            // ── Cell header: muestra tipo de culto (servicio) ─────────────
            fillTopRR(ctx, x, cellY, cellW, CHH, px(L.R, S), us.bg);
            // Línea 1: tipo de culto (servicio) — más prominente
            const servicioLabel = (group.servicio || us.label).toUpperCase();
            ctx.font = `900 ${px(9, S)}px Arial,Helvetica,sans-serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(fit(ctx, servicioLabel, cellW - px(6, S)), x + cellW / 2, cellY + CHH / 2);
            ctx.textAlign = 'left';

            let cy = cellY + CHH + px(2, S);
            ctx.textBaseline = 'middle';

            // Encargado row
            if (encargado) {
                const midY = cy + px(L.ROW_H, S) / 2;
                ctx.fillStyle = us.accent + '1A';
                ctx.fillRect(x, cy, cellW, px(L.ROW_H, S));
                ctx.fillStyle = us.accent;
                ctx.fillRect(x, cy, px(2.5, S), px(L.ROW_H, S));
                ctx.font = `700 ${px(7.5, S)}px Arial,Helvetica,sans-serif`;
                ctx.fillStyle = us.accent;
                ctx.fillText('ENCAR:', x + px(L.PX, S) + px(3, S), midY);
                const lw = ctx.measureText('ENCAR:').width + px(3, S);
                ctx.font = `600 ${px(8, S)}px Arial,Helvetica,sans-serif`;
                ctx.fillStyle = '#0f172a';
                ctx.fillText(
                    fit(ctx, shortName(encargado), cellW - px(L.PX, S) * 2 - px(3, S) - lw),
                    x + px(L.PX, S) + px(3, S) + lw,
                    midY
                );
                cy += px(L.ROW_H, S);
            }

            // Server rows — nombre corto (primer nombre + primer apellido)
            for (let j = 0; j < servers.length; j++) {
                const sv   = servers[j];
                const rowY = cy + j * px(L.ROW_H, S);
                const midY = rowY + px(L.ROW_H, S) / 2;
                if (j % 2 !== 0) {
                    ctx.fillStyle = '#00000009';
                    ctx.fillRect(x, rowY, cellW, px(L.ROW_H, S));
                }
                ctx.font = `700 ${px(7.5, S)}px Arial,Helvetica,sans-serif`;
                ctx.fillStyle = us.accent;
                ctx.fillText(abbrev(sv.posicion), x + px(L.PX, S), midY);
                ctx.fillStyle = '#cbd5e1';
                ctx.font = `400 ${px(7, S)}px Arial,Helvetica,sans-serif`;
                ctx.fillText('·', x + px(L.PX, S) + px(L.POS_W, S) - px(5, S), midY);
                ctx.font = `400 ${px(8, S)}px Arial,Helvetica,sans-serif`;
                ctx.fillStyle = '#1e293b';
                ctx.fillText(
                    fit(ctx, shortName(sv.nombre || ''), cellW - px(L.PX, S) * 2 - px(L.POS_W, S)),
                    x + px(L.PX, S) + px(L.POS_W, S),
                    midY
                );
            }

            // ── Uniforme al pie de la celda ───────────────────────────────
            if (us.label) {
                const uY = cellY + cellTotalH - px(L.ROW_H, S);
                ctx.fillStyle = us.accent + '28';
                ctx.fillRect(x, uY, cellW, px(L.ROW_H, S));
                ctx.font = `600 ${px(7, S)}px Arial,Helvetica,sans-serif`;
                ctx.fillStyle = us.accent;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(fit(ctx, us.label, cellW - px(6, S)), x + cellW / 2, uY + px(L.ROW_H, S) / 2);
                ctx.textAlign = 'left';
            }
        }

        y += WHH + GAP + cellTotalH + WGAP;
    }

    // ── Footer ─────────────────────────────────────────────────────────────
    y += GAP;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth   = Math.round(S * 0.8);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(gridX, y); ctx.lineTo(gridX + GRID_W, y); ctx.stroke();
    y += px(5, S);
    ctx.font      = `400 ${px(6.5, S)}px Arial,Helvetica,sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
        `REPORTE OFICIAL  •  GENERADO EL ${dayjs().format('DD/MM/YYYY HH:mm')}  •  © UJIERES APP SYSTEM`,
        gridX + GRID_W / 2, y
    );
    ctx.textAlign = 'left';
}

// ─── Measure total canvas height ─────────────────────────────────────────────

function measureHeight(grouped: Record<string, any>, S: number): number {
    const PAD  = px(L.PAD, S);
    const WGAP = px(L.WEEK_GAP, S);
    const GAP  = px(L.GAP, S);

    const dates = Object.keys(grouped).sort();
    if (!dates.length) return 400;

    const { allDows, weeks } = buildWeekStructure(grouped);

    let h = PAD + px(L.TITLE_H, S) + WGAP;

    for (const days of weeks) {
        const dowToDate = new Map<number, string>();
        for (const d of days) dowToDate.set(dayjs(d).day(), d);

        const maxRows = Math.max(1, ...allDows.map(dow => {
            const dt = dowToDate.get(dow);
            return dt && grouped[dt] ? rowCount(grouped[dt]) : 0;
        }));

        const cellBodyH  = maxRows * px(L.ROW_H, S) + px(4, S);
        const cellTotalH = px(L.CELL_HDR_H, S) + cellBodyH;
        h += px(L.WEEK_HDR_H, S) + GAP + cellTotalH + WGAP;
    }

    h += GAP + px(5, S) + px(14, S) + PAD;
    return h;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateCalendarCanvas(
    groupedAssignments: Record<string, any>,
    departmentName: string
): HTMLCanvasElement | null {
    const dates = Object.keys(groupedAssignments);
    if (!dates.length) return null;

    let S = 3; // 3× scale — crisp on any screen
    const tempHeight = measureHeight(groupedAssignments, S);
    
    // Si la imagen resultante es gigantesca (> 7000px en 3x), bajamos escala en móviles
    if (isMobile() && tempHeight > 4000) {
        S = 2;
    } else if (tempHeight > 8000) {
        S = 1.5;
    }

    const width  = px(L.GRID_W + L.PAD * 2, S);
    const height = measureHeight(groupedAssignments, S);

    const canvas = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    render(ctx, groupedAssignments, departmentName, S);
    return canvas;
}

export async function exportCalendarImage(
    groupedAssignments: Record<string, any>,
    departmentName: string
): Promise<void> {
    const dates = Object.keys(groupedAssignments);
    if (!dates.length) { notify.warning('No hay asignaciones para exportar.'); return; }

    notify.info('Generando imagen del calendario...', 'Exportando');
    try {
        const canvas = generateCalendarCanvas(groupedAssignments, departmentName);
        if (!canvas) throw new Error("Could not generate canvas");

        const dateLabel = dayjs(dates.sort()[0]).format('MMMM_YYYY').toUpperCase();

        await new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) { notify.error('Error al generar la imagen.'); resolve(); return; }
                const url = URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.style.display = 'none';
                a.href     = url;
                a.download = `Rol_Servicios_${dateLabel}.jpg`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 200);
                notify.success('Imagen generada exitosamente', '¡Éxito!');
                resolve();
            }, 'image/jpeg', 0.95);
        });

    } catch (err: any) {
        console.error('Calendar export error:', err);
        notify.error('Error al generar la imagen del calendario.');
    }
}
