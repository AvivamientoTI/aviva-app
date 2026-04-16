import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { notify } from '../../../utils/notificationsHelper';

dayjs.locale('es');

const DAY_ORDER = (d: number) => (d === 0 ? 7 : d);
const DAY_NAMES: Record<number, string> = {
    0: 'DOMINGO', 1: 'LUNES', 2: 'MARTES', 3: 'MIERCOLES',
    4: 'JUEVES', 5: 'VIERNES', 6: 'SABADO',
};

interface UStyle { headerBg: string; cellBg: string; accentColor: string; label: string; }

function getUStyle(uniforme: string, servicio: string): UStyle {
    const u = (uniforme || '').toLowerCase();
    const s = (servicio || '').toLowerCase();
    if (s.includes('niño') || s.includes('infantil') || s.includes('kids'))
        return { headerBg: '#6d28d9', cellBg: '#ede9fe', accentColor: '#5b21b6', label: 'CULTO NIÑOS' };
    if (s.includes('matrimoni') || s.includes('boda'))
        return { headerBg: '#0369a1', cellBg: '#e0f2fe', accentColor: '#0284c7', label: 'MATRIMONIO' };
    if (s.includes('formac') || s.includes('capacit'))
        return { headerBg: '#047857', cellBg: '#d1fae5', accentColor: '#065f46', label: 'FORMACIÓN' };
    if (s.includes('especial') || s.includes('aniversar'))
        return { headerBg: '#b45309', cellBg: '#fef3c7', accentColor: '#92400e', label: 'ESPECIAL' };
    if (u.includes('azul'))
        return { headerBg: '#1d4ed8', cellBg: '#dbeafe', accentColor: '#1e40af', label: 'CAMISA AZUL' };
    if (u.includes('vino') || u.includes('rojo') || u.includes('bordo'))
        return { headerBg: '#9f1239', cellBg: '#ffe4e6', accentColor: '#881337', label: 'CAMISA VINO' };
    if (u.includes('gris'))
        return { headerBg: '#334155', cellBg: '#f1f5f9', accentColor: '#1e293b', label: 'UNI GRIS' };
    if (u.includes('beige') || u.includes('crema'))
        return { headerBg: '#92400e', cellBg: '#fefce8', accentColor: '#78350f', label: 'CAMISA BEIGE' };
    if (u.includes('blanca') || u.includes('blanco'))
        return { headerBg: '#475569', cellBg: '#f8fafc', accentColor: '#334155', label: 'CAMISA BLANCA' };
    if (u.includes('negra') || u.includes('negro'))
        return { headerBg: '#111827', cellBg: '#e5e7eb', accentColor: '#1f2937', label: 'CAMISA NEGRA' };
    if (u.includes('formal'))
        return { headerBg: '#b45309', cellBg: '#fef3c7', accentColor: '#92400e', label: 'UNI FORMAL' };
    return { headerBg: '#374151', cellBg: '#f3f4f6', accentColor: '#1f2937', label: uniforme || 'SERVICIO' };
}

function getMondayOfWeek(d: string): string {
    const dt = dayjs(d);
    const dow = dt.day();
    return dt.subtract(dow === 0 ? 6 : dow - 1, 'day').format('YYYY-MM-DD');
}

function abbrevPos(pos: string): string {
    if (!pos) return '';
    const p = pos.toUpperCase();
    if (p.includes('ENCARGAD'))                      return 'ENCAR';
    if (p.includes('CARRO') || p.includes('PARQUEO')) return 'CARRO';
    if (p.includes('PUERTA') || p.includes('ENTRAD')) return 'PUERTA';
    if (p.includes('ALTAR D') || p.includes('PLATAF')) return 'ALT.D';
    if (p.includes('ALTAR IZ'))                       return 'ALT.IZ';
    if (p.includes('ALTAR'))                          return 'ALTAR';
    if (p.includes('BAÑO') || p.includes('BANO'))     return 'BAÑOS';
    if (p.includes('NIÑO') || p.includes('INFANTIL')) return 'NIÑOS';
    if (p.includes('SERVIR') || p.includes('SERVID')) return 'SERV';
    if (p.includes('LIBRE'))                          return 'LIBRE';
    if (p.includes('SONIDO') || p.includes('SOUND'))  return 'AUDIO';
    if (p.includes('USHER'))                          return 'USHER';
    if (p.includes('AYUD'))                           return 'AYUD';
    if (p.includes('ACOMOD'))                         return 'ACOM';
    return p.length > 7 ? p.slice(0, 6) + '.' : p;
}

/** Fit text within maxPx, appending ellipsis if needed */
function fit(ctx: CanvasRenderingContext2D, text: string, maxPx: number): string {
    if (!text) return '';
    if (ctx.measureText(text).width <= maxPx) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxPx) t = t.slice(0, -1);
    return t + '…';
}

/** Is this server the encargado? (skip to avoid double listing) */
function isEncRow(sv: any, encar: string): boolean {
    const pos = (sv.posicion || '').toUpperCase();
    if (pos.includes('ENCARGAD')) return true;
    if (!encar) return false;
    const a = (sv.nombre || '').toLowerCase().trim();
    const b = encar.toLowerCase().trim();
    return a === b || b.includes(a) || a.includes(b);
}

// ─── Drawing primitives ───────────────────────────────────────────────────────

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
            r: number, fill: string, stroke?: string, sw = 1) {
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
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.stroke(); }
}

function topRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
}

// ─── Compact constants ────────────────────────────────────────────────────────
// All "base" values are in virtual pixels at 1×.
// At S=3 they become crisp 3× pixels.

const C = {
    PAD:      16,   // canvas outer padding
    GAP:       4,   // gap between cells
    CW:      182,   // cell width
    TITLE_H:  52,   // title block height
    DHDR_H:   22,   // day-of-week column header height
    CHDR_H:   18,   // cell header bar height
    ROW_H:    13,   // height of each row (encar + servers)
    PX:        5,   // horizontal body padding
    POS_W:    40,   // width of position label column
    R:         5,   // border radius
};

function s(v: number, S: number) { return Math.round(v * S); }

// ─── Cell height ──────────────────────────────────────────────────────────────

function cellH(group: any, S: number): number {
    const servers = (group.assignments || []).filter((sv: any) => !isEncRow(sv, group.encargado || ''));
    const rows = (group.encargado ? 1 : 0) + servers.length;
    return s(C.CHDR_H, S) + rows * s(C.ROW_H, S) + s(C.PX * 2 + 2, S);
}

// ─── Draw one cell ────────────────────────────────────────────────────────────

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number,
                  maxH: number, group: any, S: number) {
    const us = getUStyle(group.uniforme, group.servicio);
    const encargado: string = group.encargado || '';
    const servers = (group.assignments || []).filter((sv: any) => !isEncRow(sv, encargado));
    const dayNum: number = group._dayNum;

    const CW   = s(C.CW, S);
    const HDR  = s(C.CHDR_H, S);
    const RR_  = s(C.R, S);
    const PX   = s(C.PX, S);
    const PW   = s(C.POS_W, S);
    const RH   = s(C.ROW_H, S);

    // Card shadow
    rr(ctx, x + s(2, S), y + s(2, S), CW, maxH, RR_, '#00000014');
    // Card bg + border
    rr(ctx, x, y, CW, maxH, RR_, us.cellBg, us.accentColor + '60', Math.round(S));

    // ── Header bar ─────────────────────────────────────────────────────────
    topRR(ctx, x, y, CW, HDR, RR_, us.headerBg);

    // Uniform label — left side
    ctx.font = `900 ${s(9, S)}px Arial,Helvetica,sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const midH = y + HDR / 2;
    // Reserve space for the date badge (circle on right)
    const badgeR = s(8, S);
    const badgeCX = x + CW - badgeR - s(5, S);
    ctx.fillText(fit(ctx, us.label, CW - badgeR * 2 - PX * 2 - s(10, S)), x + PX, midH);

    // Date badge (circle)
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.beginPath(); ctx.arc(badgeCX, midH, badgeR, 0, Math.PI * 2); ctx.fill();
    ctx.font = `900 ${s(9, S)}px Arial,Helvetica,sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(String(dayNum), badgeCX, midH);
    ctx.textAlign = 'left';

    let cy = y + HDR + s(C.PX, S);

    // ── Encargado row ──────────────────────────────────────────────────────
    if (encargado) {
        const midE = cy + RH / 2;
        // Subtle background
        ctx.fillStyle = us.accentColor + '18';
        ctx.fillRect(x, cy, CW, RH);
        // Accent left bar
        ctx.fillStyle = us.accentColor;
        ctx.fillRect(x, cy, s(3, S), RH);
        // Label
        ctx.font = `700 ${s(8, S)}px Arial,Helvetica,sans-serif`;
        ctx.fillStyle = us.accentColor;
        ctx.textBaseline = 'middle';
        ctx.fillText('ENCAR:', x + PX + s(4, S), midE);
        const lw = ctx.measureText('ENCAR:').width + s(4, S);
        // Name
        ctx.font = `600 ${s(8.5, S)}px Arial,Helvetica,sans-serif`;
        ctx.fillStyle = '#0f172a';
        ctx.fillText(fit(ctx, encargado, CW - PX * 2 - s(4, S) - lw), x + PX + s(4, S) + lw, midE);
        cy += RH;
    }

    // ── Server rows ────────────────────────────────────────────────────────
    for (let i = 0; i < servers.length; i++) {
        const sv = servers[i];
        const rowY = cy + i * RH;
        const midY = rowY + RH / 2;

        // Zebra
        if (i % 2 !== 0) {
            ctx.fillStyle = '#00000009';
            ctx.fillRect(x, rowY, CW, RH);
        }

        // Position — bold accent
        ctx.font = `700 ${s(8, S)}px Arial,Helvetica,sans-serif`;
        ctx.fillStyle = us.accentColor;
        ctx.textBaseline = 'middle';
        ctx.fillText(abbrevPos(sv.posicion), x + PX, midY);

        // Separator
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('·', x + PX + PW - s(6, S), midY);

        // Name — regular
        ctx.font = `400 ${s(8.5, S)}px Arial,Helvetica,sans-serif`;
        ctx.fillStyle = '#1e293b';
        ctx.fillText(fit(ctx, sv.nombre || '', CW - PX * 2 - PW), x + PX + PW, midY);
    }
}

// ─── Full render ──────────────────────────────────────────────────────────────

function render(ctx: CanvasRenderingContext2D, grouped: Record<string, any>, dept: string, S: number) {
    const PAD  = s(C.PAD, S);
    const GAP  = s(C.GAP, S);
    const CW   = s(C.CW, S);
    const R    = s(C.R, S);

    const dates = Object.keys(grouped).sort();

    const usedDow = [...new Set(dates.map(d => dayjs(d).day()))].sort((a, b) => DAY_ORDER(a) - DAY_ORDER(b));
    const nCols = usedDow.length;
    const GRID_W = nCols * CW + (nCols - 1) * GAP;

    const weekMap = new Map<string, Set<string>>();
    for (const d of dates) {
        const m = getMondayOfWeek(d);
        if (!weekMap.has(m)) weekMap.set(m, new Set());
        weekMap.get(m)!.add(d);
    }
    const weeks = [...weekMap.keys()].sort();

    // ── Title ──────────────────────────────────────────────────────────────
    const TH = s(C.TITLE_H, S);
    const tY = PAD;
    rr(ctx, PAD, tY, GRID_W, TH, R, '#fffbeb', '#d97706', s(2.5, S));
    ctx.fillStyle = '#d97706';
    ctx.fillRect(PAD, tY, s(4, S), TH);

    ctx.font = `900 ${s(20, S)}px Arial,Helvetica,sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const monthLabel = dayjs(dates[0]).format('MMMM YYYY').toUpperCase();
    ctx.fillText(`ROL DE ${monthLabel}`, PAD + GRID_W / 2, tY + TH * (dept ? 0.36 : 0.5));

    if (dept) {
        ctx.font = `700 ${s(10, S)}px Arial,Helvetica,sans-serif`;
        ctx.fillStyle = '#d97706';
        ctx.fillText(dept.toUpperCase(), PAD + GRID_W / 2, tY + TH * 0.70);
    }
    ctx.textAlign = 'left';

    let y = tY + TH + GAP * 2;

    // ── Day-of-week headers ────────────────────────────────────────────────
    const DHH = s(C.DHDR_H, S);
    for (let i = 0; i < nCols; i++) {
        const x = PAD + i * (CW + GAP);
        rr(ctx, x, y, CW, DHH, R, '#0f172a');
        ctx.font = `900 ${s(10, S)}px Arial,Helvetica,sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(DAY_NAMES[usedDow[i]], x + CW / 2, y + DHH / 2);
    }
    ctx.textAlign = 'left';
    y += DHH + GAP;

    // ── Weeks ──────────────────────────────────────────────────────────────
    for (const monday of weeks) {
        let maxH = s(30, S);
        for (const dow of usedDow) {
            const dt = dayjs(monday).add(dow === 0 ? 6 : dow - 1, 'day').format('YYYY-MM-DD');
            const g = grouped[dt];
            if (g) { const h = cellH(g, S); if (h > maxH) maxH = h; }
        }

        for (let i = 0; i < nCols; i++) {
            const dow = usedDow[i];
            const dt = dayjs(monday).add(dow === 0 ? 6 : dow - 1, 'day').format('YYYY-MM-DD');
            const g = grouped[dt];
            const x = PAD + i * (CW + GAP);

            if (!g) continue; // skip blanks — no gap artifacts

            g._dayNum = dayjs(dt).date();
            drawCell(ctx, x, y, maxH, g, S);
        }
        y += maxH + GAP;
    }

    // ── Footer ─────────────────────────────────────────────────────────────
    y += GAP * 2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.round(S);
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(PAD + GRID_W, y); ctx.stroke();
    y += s(6, S);
    ctx.font = `400 ${s(7, S)}px Arial,Helvetica,sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`REPORTE OFICIAL  •  GENERADO EL ${dayjs().format('DD/MM/YYYY HH:mm')}  •  © UJIERES APP SYSTEM`, PAD + GRID_W / 2, y);
    ctx.textAlign = 'left';
}

// ─── Size measurement (mirrors render logic without drawing) ──────────────────

function measure(grouped: Record<string, any>, S: number): { width: number; height: number } {
    const PAD = s(C.PAD, S);
    const GAP = s(C.GAP, S);
    const CW  = s(C.CW, S);

    const dates = Object.keys(grouped).sort();
    if (!dates.length) return { width: 800, height: 400 };

    const usedDow = [...new Set(dates.map(d => dayjs(d).day()))].sort((a, b) => DAY_ORDER(a) - DAY_ORDER(b));
    const GRID_W = usedDow.length * CW + (usedDow.length - 1) * GAP;

    const weekMap = new Map<string, Set<string>>();
    for (const d of dates) {
        const m = getMondayOfWeek(d);
        if (!weekMap.has(m)) weekMap.set(m, new Set());
        weekMap.get(m)!.add(d);
    }

    let h = PAD + s(C.TITLE_H, S) + GAP * 2 + s(C.DHDR_H, S) + GAP;
    for (const monday of weekMap.keys()) {
        let maxH = s(30, S);
        for (const dow of usedDow) {
            const dt = dayjs(monday).add(dow === 0 ? 6 : dow - 1, 'day').format('YYYY-MM-DD');
            const g = grouped[dt];
            if (g) { const ch = cellH(g, S); if (ch > maxH) maxH = ch; }
        }
        h += maxH + GAP;
    }
    h += GAP * 2 + s(6, S) + s(16, S) + PAD;

    return { width: GRID_W + PAD * 2, height: h };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function exportCalendarImage(
    groupedAssignments: Record<string, any>,
    departmentName: string
): Promise<void> {
    const dates = Object.keys(groupedAssignments);
    if (!dates.length) { notify.warning('No hay asignaciones para exportar.'); return; }

    notify.info('Generando imagen del calendario...', 'Exportando');
    try {
        const S = 3;
        const { width, height } = measure(groupedAssignments, S);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        render(ctx, groupedAssignments, departmentName, S);

        const dateLabel = dayjs(dates.sort()[0]).format('MMMM_YYYY').toUpperCase();

        await new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) { notify.error('Error al generar la imagen.'); resolve(); return; }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
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
