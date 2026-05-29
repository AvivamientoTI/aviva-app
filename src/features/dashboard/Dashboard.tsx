import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Text,
    Group,
    Stack,
    Badge,
    SimpleGrid,
    Card,
    Box,
    Select,
    Skeleton,
    Button,
    Divider,
    Menu,
    ThemeIcon
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconCalendarEvent,
    IconCalendarCheck,
    IconChecklist,
    IconUsers,
    IconTrendingUp,
    IconCalendarOff,
    IconFileDownload,
    IconShare,
    IconPhoto,
    IconFileTypePdf,
    IconChevronDown,
    IconArrowRight
} from '@tabler/icons-react';
import { DonutChart } from '@mantine/charts';
import { useUser } from '../../contexts/UserContext';
import { getUniformeColor } from '../../utils/calendar/colorMapper';
// import { AiQueryWidget } from './components/AiQueryWidget';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useRoleExport } from './hooks/useRoleExport';
import { StatCard } from './components/StatCard';
import { WelcomeCard } from './components/WelcomeCard';
import { UpcomingServiceCard } from './components/UpcomingServiceCard';
import { parseRoles } from '../../utils/roleUtils';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import 'dayjs/locale/es';

dayjs.extend(calendar);
dayjs.locale('es');

import { PersonalRoleTemplate } from '../reports/PersonalRoleTemplate';

// Helper to safely get the first item or the item itself
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSingle = (val: any) => Array.isArray(val) ? val[0] : val;

export default function Dashboard() {
    const { userProfile, attendanceManagedDepartments, userMemberships } = useUser();
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

    // Initial department selection: prefer attendance-managed depts (leaders), fallback to memberships (servers)
    useEffect(() => {
        if (selectedDeptId) return;
        if (attendanceManagedDepartments && attendanceManagedDepartments.length > 0) {
            setSelectedDeptId(attendanceManagedDepartments[0].id);
        } else if (userMemberships && userMemberships.length > 0) {
            const deptId = userMemberships[0].departamento?.id;
            if (deptId) setSelectedDeptId(deptId);
        }
    }, [attendanceManagedDepartments, userMemberships]);

    const { upcoming, upcomingCount, personalStats, deptStats, isLeader, loading } = useDashboardData(selectedDeptId);

    const { exporting, exportData, reportRef, handleExportRole } = useRoleExport(userProfile);
    const navigate = useNavigate();

    if (loading) {
        return (
            <Container size="xl" py="md">
                <Stack gap="lg">
                    {/* Skeleton for Welcome & Upcoming */}
                    <Grid gutter="lg">
                        <Grid.Col span={{ base: 12, md: 7 }}>
                            <Skeleton height={{ base: 200, sm: 280 }} radius="lg" />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 5 }}>
                            <Skeleton height={{ base: 180, sm: 280 }} radius="xl" />
                        </Grid.Col>
                    </Grid>

                    {/* Skeleton for Stats */}
                    <SimpleGrid cols={{ base: 2, sm: 2, md: 4 }}>
                        <Skeleton height={140} radius="lg" />
                        <Skeleton height={140} radius="lg" />
                        <Skeleton height={140} radius="lg" />
                        <Skeleton height={140} radius="lg" />
                    </SimpleGrid>

                    {/* Skeleton for Charts/Lists */}
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 8 }}>
                            <Skeleton height={{ base: 200, sm: 300 }} radius="md" />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Skeleton height={{ base: 200, sm: 300 }} radius="md" />
                        </Grid.Col>
                    </Grid>
                </Stack>
            </Container>
        );
    }

    const personalTotal = personalStats?.summary.total || 0;
    const personalRate = personalTotal > 0
        ? Math.round((personalStats!.summary.asistio / personalTotal) * 100)
        : 0;

    const lastMonthStat = (personalStats as any)?.lastMonthSummary;
    const lastMonthTotal = lastMonthStat ? (lastMonthStat.asistio + lastMonthStat.faltas) : 0;

    const deptTotal = deptStats?.summary.total || 0;
    const deptRate = deptTotal > 0
        ? Math.round((deptStats!.summary.asistio / deptTotal) * 100)
        : 0;

    const nextService = upcoming.length > 0 ? upcoming[0] : null;

    // Lógica de compartir rol (Web Share API)
    const handleShareRole = async () => {
        if (!upcoming.length) return;

        const first = upcoming[0];
        const config = getSingle(first.configuracion_dia);
        const pos = getSingle(first.posicion);
        const dateStr = dayjs(config?.fecha).format('dddd D [de] MMMM');

        const text = `Mi próximo servicio como Ujier será el ${dateStr}.\n\nDepartamento: ${getSingle(pos?.departamento)?.nombre}\nPosición: ${pos?.nombre}\nUniforme: ${config?.color_uniforme}\nServicio: ${config?.tipo_servicio}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Mi Rol de Servicio',
                    text: text,
                    url: window.location.href
                });
            } catch (err) {
                console.error('Error al compartir:', err);
            }
        } else {
            // Fallback: Copiar al portapapeles
            try {
                await navigator.clipboard.writeText(text);
                notifications.show({
                    title: 'Copiado al portapapeles',
                    message: 'Comparte los detalles de tu rol desde cualquier app.',
                    color: 'teal'
                });
            } catch (err) {
                console.error('Error al copiar:', err);
            }
        }
    };



    // Calcular la etiqueta de membresía de mayor rango
    const getMembershipLabel = (): string | undefined => {
        // Prioridad 1: etiqueta especial personalizada (ej. "Pastora")
        const etiqueta = (userProfile?.usuario as any)?.etiqueta;
        if (etiqueta) return etiqueta;

        // Prioridad 2: rol jerárquico de mayor rango en sus membresías
        const roleOrder = ['líder', 'sublíder', 'encargado', 'encargada', 'servidor', 'servidora'];
        let topLabel: string | undefined;
        let topIndex = roleOrder.length;

        for (const m of (userMemberships || [])) {
            const { isLider, isSublider, isEncargado, isServidor } = parseRoles(m.rol_jerarquico);
            let label: string | undefined;
            let idx = topIndex;

            if (isLider)       { label = 'Líder';        idx = 0; }
            else if (isSublider)   { label = 'Sublíder';     idx = 1; }
            else if (isEncargado)  {
                label = m.rol_jerarquico || 'Encargado';
                idx = 2;
            }
            else if (isServidor)   {
                label = m.rol_jerarquico || 'Servidor';
                idx = 4;
            }

            if (label && idx < topIndex) {
                topLabel = label;
                topIndex = idx;
            }
        }
        return topLabel;
    };

    const membershipLabel = getMembershipLabel();

    return (
        <Container size="xl" py={{ base: 'md', sm: 'xl' }}>

            {/* ── Sección 1: Operacional ────────────────────────────────
                UpcomingServiceCard primera en el DOM (mobile stacks top-down).
                En desktop toma 7/12 — dato operativo dominante.
                WelcomeCard secundaria: contexto e identidad.             */}
            <Grid gutter={{ base: 'md', lg: 'xl' }} align="stretch" mb={{ base: 'lg', sm: 'xl' }}>
                <Grid.Col span={{ base: 12, lg: 7 }} className="animate-fade-in card-stagger-1">
                    <UpcomingServiceCard
                        nextService={nextService}
                        serverName={userProfile?.usuario ? `${(userProfile.usuario as any).nombre} ${(userProfile.usuario as any).apellido}` : ''}
                    />
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 5 }} className="animate-fade-in card-stagger-2">
                    <WelcomeCard userName={userProfile?.usuario?.nombre || 'Servidor'} membershipLabel={membershipLabel} />
                </Grid.Col>
            </Grid>

            {/* ── Sección 2: Actividad personal ────────────────────────
                Separador visual + label de sección dan ritmo entre zonas.
                Stats en grid de 4 — espaciado más compacto que la sección hero. */}
            <Box mb="xl">
                <Text className="section-label" mb="md">
                    Tu actividad
                </Text>
                <SimpleGrid cols={{ base: 2, sm: 2, md: 4 }} spacing="md">
                    <Box className="animate-fade-in card-stagger-2">
                        <StatCard
                            title="Mi Asistencia"
                            value={`${personalRate}%`}
                            subtitle={`Promedio ${dayjs().year()}`}
                            icon={<IconTrendingUp size={24} />}
                            color="teal"
                            trendData={personalStats?.byMonth ? Object.values(personalStats.byMonth as any).slice(-4).map((m: any) => (m.asistio / (m.asistio + m.faltas || 1)) * 100) : []}
                        />
                    </Box>
                    <Box className="animate-fade-in card-stagger-3">
                        <StatCard
                            title="Próximos Servicios"
                            value={upcomingCount}
                            icon={<IconCalendarEvent size={24} />}
                            color="gold"
                        />
                    </Box>
                    <Box className="animate-fade-in card-stagger-4">
                        <StatCard
                            title="Mes Pasado"
                            value={lastMonthTotal}
                            subtitle={(personalStats as any)?.lastMonthSummary?.month || ''}
                            icon={<IconChecklist size={24} />}
                            color="stone"
                        />
                    </Box>
                    <Box className="animate-fade-in card-stagger-5">
                        <StatCard
                            title="Departamentos"
                            value={Array.from(new Set([
                                ...(attendanceManagedDepartments?.map(d => d.id) || []),
                                ...(userMemberships?.map(m => m.departamento?.id).filter(Boolean) || [])
                            ])).length}
                            icon={<IconUsers size={24} />}
                            color="orange"
                        />
                    </Box>
                </SimpleGrid>
            </Box>

            {/* ── Sección 3: Servicios + Estadísticas ──────────────────
                Separador de sección.
                Lista de servicios ocupa más espacio si no hay stats de líder.
                Selector de departamento vive en el header de su propia card. */}
            <Box mb="xl">
                <Text className="section-label" mb="md">
                    Servicios y estadísticas
                </Text>
            </Box>

            <Grid gutter={{ base: 'md', lg: 'xl' }}>
                <Grid.Col span={{ base: 12, md: isLeader ? 8 : 12 }} className="animate-fade-in card-stagger-3">
                    <Card withBorder p="lg" radius="lg" className="hover-card" h="100%">
                        <Group justify="space-between" mb="lg" wrap="wrap" gap="sm">
                            <Text fw={800} size="lg" c="var(--mantine-color-text)" style={{ letterSpacing: '-0.01em' }}>
                                Mis Próximos Servicios
                            </Text>
                            <Group gap="xs">
                                <Button
                                    variant="subtle"
                                    className="btn-glass-subtle"
                                    size="xs"
                                    radius="xl"
                                    leftSection={<IconShare size={16} />}
                                    onClick={handleShareRole}
                                    disabled={!upcoming.length}
                                >
                                    Compartir
                                </Button>
                                <Menu shadow="md" width={180} radius="md" position="bottom-end">
                                    <Menu.Target>
                                        <Button
                                            variant="subtle"
                                            className="btn-glass-subtle"
                                            size="xs"
                                            radius="xl"
                                            leftSection={<IconFileDownload size={16} />}
                                            rightSection={<IconChevronDown size={12} />}
                                            loading={exporting}
                                        >
                                            Exportar Rol
                                        </Button>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Label>Formato</Menu.Label>
                                        <Menu.Item leftSection={<IconPhoto size={14} />} onClick={() => handleExportRole('png')}>
                                            Imagen (PNG)
                                        </Menu.Item>
                                        <Menu.Item leftSection={<IconFileTypePdf size={14} />} onClick={() => handleExportRole('pdf')}>
                                            Documento PDF
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>
                        </Group>
                        {upcoming.length > 0 ? (
                            <Stack gap={0}>
                                {upcoming.map((service: any, index: number) => {
                                    const configDia = getSingle(service.configuracion_dia);
                                    const pos = getSingle(service.posicion);
                                    const dept = getSingle(pos?.departamento);
                                    return (
                                        <Box
                                            key={service.id}
                                            py="sm"
                                            px="xs"
                                            style={{
                                                borderTop: index > 0 ? '1px solid var(--mantine-color-default-border)' : 'none',
                                            }}
                                        >
                                            <Group justify="space-between" wrap="wrap" gap="xs">
                                                <Stack gap={2}>
                                                    <Text size="xs" fw={700} c="gold.6" tt="uppercase" style={{ letterSpacing: 'var(--ls-label)' }}>
                                                        {dept?.nombre}
                                                    </Text>
                                                    <Text fw={600} c="stone.7" size="sm">{configDia?.tipo_servicio}</Text>
                                                    <Text size="sm" c="dimmed">
                                                        {dayjs(configDia?.fecha).format('dddd, D [de] MMMM')}
                                                    </Text>
                                                </Stack>
                                                <Group gap="xs">
                                                    <Badge color="stone" variant="light">{pos?.nombre}</Badge>
                                                    <Badge color={getUniformeColor(configDia?.color_uniforme)} variant="filled">
                                                        {configDia?.color_uniforme}
                                                    </Badge>
                                                </Group>
                                            </Group>
                                        </Box>
                                    )
                                })}
                            </Stack>
                        ) : (
                            <Stack align="center" py="xl" gap="md">
                                <IconCalendarOff size={40} color="var(--mantine-color-dimmed)" stroke={1.5} />
                                <Stack gap={4} align="center">
                                    <Text ta="center" c="dimmed" fw={600}>Sin servicios próximos</Text>
                                    <Text size="xs" c="dimmed" ta="center" maw={260}>
                                        Cuando tu líder te asigne a un servicio, aparecerá aquí.
                                    </Text>
                                </Stack>
                                <Button
                                    variant="subtle"
                                    color="stone"
                                    size="xs"
                                    radius="xl"
                                    rightSection={<IconArrowRight size={14} />}
                                    onClick={() => navigate('/calendar')}
                                >
                                    Ver el calendario
                                </Button>
                            </Stack>
                        )}
                    </Card>
                </Grid.Col>

                {isLeader && (
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Grid gutter="md">
                            {/* Stats personales */}
                            <Grid.Col span={12} className="animate-fade-in card-stagger-4">
                                <Card withBorder p="lg" radius="lg" className="hover-card" h="100%">
                                    <Text fw={800} size="md" mb={4} style={{ letterSpacing: '-0.01em' }}>
                                        Asistencia personal
                                    </Text>
                                    <Text size="xs" c="dimmed" fw={600} mb="md">Período en curso</Text>
                                    {personalStats && personalStats.summary.total > 0 ? (
                                        <Stack gap="md">
                                            <Box w="100%" h={160} style={{ minWidth: 0 }}>
                                                <DonutChart h={160} data={[
                                                    { name: 'Asistió', value: personalStats.summary.asistio, color: 'teal.6' },
                                                    { name: 'Justificado', value: personalStats.summary.faltoConAviso, color: 'yellow.6' },
                                                    { name: 'Faltó', value: personalStats.summary.faltoSinAviso, color: 'red.6' },
                                                ]} tooltipDataSource="segment" withLabelsLine withLabels />
                                            </Box>
                                            <Stack gap={4}>
                                                <Group justify="space-between">
                                                    <Group gap={6}><Box w={8} h={8} style={{ borderRadius: '50%', background: 'var(--mantine-color-teal-6)', flexShrink: 0 }} /><Text size="sm" fw={600}>Asistió</Text></Group>
                                                    <Text size="sm" fw={700}>{personalStats.summary.asistio}</Text>
                                                </Group>
                                                <Group justify="space-between">
                                                    <Group gap={6}><Box w={8} h={8} style={{ borderRadius: '50%', background: 'var(--mantine-color-yellow-6)', flexShrink: 0 }} /><Text size="sm" fw={600}>Justificado</Text></Group>
                                                    <Text size="sm" fw={700}>{personalStats.summary.faltoConAviso}</Text>
                                                </Group>
                                                <Group justify="space-between">
                                                    <Group gap={6}><Box w={8} h={8} style={{ borderRadius: '50%', background: 'var(--mantine-color-red-6)', flexShrink: 0 }} /><Text size="sm" fw={600}>Faltó</Text></Group>
                                                    <Text size="sm" fw={700}>{personalStats.summary.faltoSinAviso}</Text>
                                                </Group>
                                            </Stack>
                                            <Button
                                                variant="light"
                                                color="teal"
                                                size="xs"
                                                radius="md"
                                                rightSection={<IconArrowRight size={14} />}
                                                onClick={() => navigate('/attendance/personal')}
                                                fullWidth
                                            >
                                                Ver historial
                                            </Button>
                                        </Stack>
                                    ) : personalStats ? (
                                        <Stack align="center" py="lg" gap="sm">
                                            <ThemeIcon size={44} radius="xl" variant="light" color="gold">
                                                <IconCalendarCheck size={22} />
                                            </ThemeIcon>
                                            <Stack gap={2} align="center">
                                                <Text size="sm" fw={700}>Aún sin registros</Text>
                                                <Text size="xs" c="dimmed" ta="center">
                                                    Tus estadísticas aparecerán después de tu primer servicio.
                                                </Text>
                                            </Stack>
                                        </Stack>
                                    ) : (
                                        <Stack align="center" py="lg" gap="sm">
                                            <ThemeIcon size={44} radius="xl" variant="light" color="stone">
                                                <IconUsers size={22} stroke={1.5} />
                                            </ThemeIcon>
                                            <Text ta="center" c="dimmed" size="sm">Sin datos todavía.</Text>
                                        </Stack>
                                    )}
                                </Card>
                            </Grid.Col>

                            {/* Stats de departamento */}
                            <Grid.Col span={12} className="animate-fade-in card-stagger-5">
                                <Card withBorder p="lg" radius="lg" className="hover-card" h="100%">
                                    <Group justify="space-between" mb={4} wrap="nowrap" align="flex-start">
                                        <Text fw={800} size="md" style={{ letterSpacing: '-0.01em' }}>
                                            Departamento
                                        </Text>
                                        {attendanceManagedDepartments && attendanceManagedDepartments.length > 1 ? (
                                            <Select
                                                size="xs"
                                                radius="md"
                                                data={attendanceManagedDepartments
                                                    .filter((d, i, self) => i === self.findIndex(x => x.id === d.id))
                                                    .map(d => ({ value: String(d.id), label: d.nombre }))}
                                                value={selectedDeptId ? String(selectedDeptId) : null}
                                                onChange={(val) => setSelectedDeptId(val ? Number(val) : null)}
                                                style={{ width: 120 }}
                                                styles={{ input: { fontSize: '0.75rem' } }}
                                            />
                                        ) : (
                                            <Badge color="orange" variant="light" size="sm">Líder</Badge>
                                        )}
                                    </Group>
                                    <Text size="xs" c="dimmed" fw={600} mb="md">Asistencia del equipo</Text>
                                    {deptStats && deptStats.summary.total > 0 ? (
                                        <Stack gap="md">
                                            <Box w="100%" h={160} style={{ minWidth: 0 }}>
                                                <DonutChart h={160} data={[
                                                    { name: 'Asistió', value: deptStats.summary.asistio, color: 'teal.6' },
                                                    { name: 'Justificado', value: deptStats.summary.faltoConAviso, color: 'yellow.6' },
                                                    { name: 'Faltó', value: deptStats.summary.faltoSinAviso, color: 'red.6' },
                                                ]} tooltipDataSource="segment" withLabelsLine withLabels />
                                            </Box>
                                            <Stack gap={4}>
                                                <Group justify="space-between">
                                                    <Text size="xs" c="dimmed" fw={700}>Tasa general</Text>
                                                    <Badge color="teal" variant="light" size="sm">{deptRate}%</Badge>
                                                </Group>
                                                <Group justify="space-between">
                                                    <Text size="xs" c="dimmed" fw={700}>Servicios registrados</Text>
                                                    <Text size="sm" fw={800}>{deptStats.summary.total}</Text>
                                                </Group>
                                            </Stack>
                                            <Button
                                                variant="light"
                                                color="gold"
                                                size="xs"
                                                radius="md"
                                                rightSection={<IconArrowRight size={14} />}
                                                onClick={() => navigate('/analytics')}
                                                fullWidth
                                            >
                                                Ver estadísticas
                                            </Button>
                                        </Stack>
                                    ) : deptStats ? (
                                        <Stack align="center" py="lg" gap="sm">
                                            <ThemeIcon size={44} radius="xl" variant="light" color="stone">
                                                <IconCalendarCheck size={22} />
                                            </ThemeIcon>
                                            <Stack gap={2} align="center">
                                                <Text size="sm" fw={700}>Sin registros aún</Text>
                                                <Text size="xs" c="dimmed" ta="center">
                                                    Los datos del departamento aparecerán después del primer servicio registrado.
                                                </Text>
                                            </Stack>
                                        </Stack>
                                    ) : (
                                        <Stack align="center" py="lg" gap="xs">
                                            <IconUsers size={32} color="var(--mantine-color-dimmed)" stroke={1.5} />
                                            <Text ta="center" c="dimmed" size="sm">Sin datos del departamento.</Text>
                                        </Stack>
                                    )}
                                </Card>
                            </Grid.Col>
                        </Grid>
                    </Grid.Col>
                )}

                {/* Para servidores (no líderes): stats personales en columna completa */}
                {!isLeader && (
                    <Grid.Col span={{ base: 12, md: 4 }} className="animate-fade-in card-stagger-4">
                        <Card withBorder p="lg" radius="lg" className="hover-card" h="100%">
                            <Text fw={800} size="md" mb={4} style={{ letterSpacing: '-0.01em' }}>
                                Mi Asistencia
                            </Text>
                            <Text size="xs" c="dimmed" fw={600} mb="md">Período en curso</Text>
                            {personalStats && personalStats.summary.total > 0 ? (
                                <Stack gap="md">
                                    <Box w="100%" h={180} style={{ minWidth: 0 }}>
                                        <DonutChart h={180} data={[
                                            { name: 'Asistió', value: personalStats.summary.asistio, color: 'teal.6' },
                                            { name: 'Justificado', value: personalStats.summary.faltoConAviso, color: 'yellow.6' },
                                            { name: 'Faltó', value: personalStats.summary.faltoSinAviso, color: 'red.6' },
                                        ]} tooltipDataSource="segment" withLabelsLine withLabels />
                                    </Box>
                                    <Divider />
                                    <Stack gap={4}>
                                        <Group justify="space-between">
                                            <Group gap={6}><Box w={8} h={8} style={{ borderRadius: '50%', background: 'var(--mantine-color-teal-6)', flexShrink: 0 }} /><Text size="sm" fw={600}>Asistió</Text></Group>
                                            <Text size="sm" fw={700}>{personalStats.summary.asistio}</Text>
                                        </Group>
                                        <Group justify="space-between">
                                            <Group gap={6}><Box w={8} h={8} style={{ borderRadius: '50%', background: 'var(--mantine-color-yellow-6)', flexShrink: 0 }} /><Text size="sm" fw={600}>Justificado</Text></Group>
                                            <Text size="sm" fw={700}>{personalStats.summary.faltoConAviso}</Text>
                                        </Group>
                                        <Group justify="space-between">
                                            <Group gap={6}><Box w={8} h={8} style={{ borderRadius: '50%', background: 'var(--mantine-color-red-6)', flexShrink: 0 }} /><Text size="sm" fw={600}>Faltó</Text></Group>
                                            <Text size="sm" fw={700}>{personalStats.summary.faltoSinAviso}</Text>
                                        </Group>
                                        <Group justify="space-between" pt={4}>
                                            <Text size="xs" c="dimmed" fw={700}>Total</Text>
                                            <Text size="sm" fw={800}>{personalStats.summary.total}</Text>
                                        </Group>
                                    </Stack>
                                    <Button
                                        variant="light"
                                        color="teal"
                                        size="xs"
                                        radius="md"
                                        rightSection={<IconArrowRight size={14} />}
                                        onClick={() => navigate('/attendance/personal')}
                                        fullWidth
                                    >
                                        Ver historial
                                    </Button>
                                </Stack>
                            ) : personalStats ? (
                                <Stack align="center" py="xl" gap="sm">
                                    <ThemeIcon size={52} radius="xl" variant="light" color="gold">
                                        <IconCalendarCheck size={26} />
                                    </ThemeIcon>
                                    <Stack gap={4} align="center">
                                        <Text size="md" fw={800}>Bienvenido al equipo</Text>
                                        <Text size="sm" c="dimmed" ta="center" maw={260}>
                                            Tus estadísticas de asistencia aparecerán aquí después de tu primer servicio.
                                        </Text>
                                    </Stack>
                                    <Button
                                        variant="subtle"
                                        color="stone"
                                        size="xs"
                                        radius="xl"
                                        rightSection={<IconArrowRight size={14} />}
                                        onClick={() => navigate('/calendar')}
                                    >
                                        Ver el calendario
                                    </Button>
                                </Stack>
                            ) : (
                                <Stack align="center" py="xl" gap="sm">
                                    <ThemeIcon size={52} radius="xl" variant="light" color="stone">
                                        <IconUsers size={26} stroke={1.5} />
                                    </ThemeIcon>
                                    <Text ta="center" c="dimmed" size="sm">Sin datos de asistencia.</Text>
                                </Stack>
                            )}
                        </Card>
                    </Grid.Col>
                )}
            </Grid>

            {/* Template for export (Hidden) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {exportData && (
                    <PersonalRoleTemplate
                        ref={reportRef}
                        userName={`${userProfile?.usuario?.nombre} ${userProfile?.usuario?.apellido}`}
                        assignments={exportData}
                        month={dayjs().month() + 1}
                        year={dayjs().year()}
                    />
                )}
            </div>
        </Container>
    );
}
