# PRODUCT.md — Aviva App

## Product Purpose
Operational management platform for church volunteer servers ("ujieres") at Iglesia Avivamiento y Poder. Centralizes attendance tracking, monthly scheduling, event management, and analytics — replacing manual spreadsheet workflows. The app reduces administrative overhead and brings visibility and fairness to volunteer coordination.

## Register
product

## Users
- **Admin**: full system access, global analytics
- **Lider / Sublider**: department management, planning wizard, attendance registry, member directory
- **Encargado/Encargada**: marks attendance in real-time during services
- **Servidor/Servidora**: views personal attendance history, calendar, internal agenda

Typical session: a lider opens the dashboard before a weekly service, reviews the upcoming calendar, checks attendance stats, and runs the monthly planning wizard. On service day, an encargado logs attendance on a phone from the church entrance.

## Brand
- **Name**: Aviva App / Servidores Avivamiento y Poder
- **Tone**: Professional, trustworthy, warm. Not casual. Not corporate cold. Volunteers serving with dignity.
- **Primary color**: Orange-gold (`#d97706`, `#b45309`) — the flame that represents the church's identity
- **Neutrals**: Warm stone tones (not cool gray)
- **Mode**: Light primary, dark mode supported
- **Typography**: Inter — tight letter-spacing, strong weight contrast
- **Feel**: Premium operational tool. Clean hierarchy, no noise, everything in its place.

## Anti-references
- Generic SaaS dashboards with sea-of-cards layouts
- Dark "hacker" dashboards (Grafana-style) — this is for church leaders, not SREs
- Bright consumer apps (feels unprofessional for operational context)
- Glassmorphism overuse — already present, should be restrained
- Gradient text decorations — never meaningful here

## Strategic Principles
- Role-based: show only what each role needs, nothing more
- Mobile-first for encargados (attendance marking happens on phones at the door)
- Desktop-optimized for liders (planning and analytics are complex, need space)
- Speed matters: the app is opened quickly before/during services
- Data integrity above aesthetics: attendance records are canonical, never lose them

## Features / Routes
- `/` — Dashboard (stats overview, upcoming service card, AI chat widget — secondary feature)
- `/agenda` — Internal event feed
- `/calendar` — Monthly service schedule with assignments
- `/attendance/personal` — Personal attendance history
- `/planning` — Monthly planning wizard (multi-step, auto-assignment)
- `/departments` — Department, position, uniform management
- `/analytics` — Department-level analytics
- `/admin/analytics` — System-wide analytics (admin only)
- `/servers` — Member directory, availability, suspensions
- `/servers/:id` — Server profile (read-only): attendance history, assigned positions, personal data
- `/suspensions` — Suspension and inactivity management
- `/attendance` — Live attendance marking (encargados)
- `/attendance/registry` — Attendance history and bulk review
