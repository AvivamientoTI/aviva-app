import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Title,
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
    Alert,
    ThemeIcon,
    Divider,
    Menu
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconCalendarEvent,
    IconChecklist,
    IconUsers,
    IconTrendingUp,
    IconCalendarOff,
    IconAlertCircle,
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
import { AiQueryWidget } from './components/AiQueryWidget';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useRoleExport } from './hooks/useRoleExport';
import { StatCard } from './components/StatCard';
import { WelcomeCard } from './components/WelcomeCard';
import { UpcomingServiceCard } from './components/UpcomingServiceCard';
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

    const { upcoming, upcomingCount, personalStats, deptStats, isLeader, effectiveDeptId, loading } = useDashboardData(selectedDeptId);

    const { exporting, exportData, reportRef, handleExportRole } = useRoleExport(userProfile);
    const navigate = useNavigate();

    if (loading) {
        return (
            <Container size="xl" py="md">
                <Stack gap="lg">
                    {/* Skeleton for Welcome & Upcoming */}
                    <Grid gutter="lg">
                        <Grid.Col span={{ base: 12, md: 7 }}>
                            <Skeleton height={280} radius="lg" />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 5 }}>
                            <Skeleton height={280} radius="xl" />
                        </Grid.Col>
                    </Grid>

                    {/* Skeleton for Stats */}
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                        <Skeleton height={140} radius="lg" />
                        <Skeleton height={140} radius="lg" />
                        <Skeleton height={140} radius="lg" />
                        <Skeleton height={140} radius="lg" />
                    </SimpleGrid>

                    {/* Skeleton for Charts/Lists */}
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 8 }}>
                            <Skeleton height={300} radius="md" />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Skeleton height={300} radius="md" />
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

        const text = `🙌 ¡Hola! Mi próximo servicio como Ujier será el ${dateStr}.\n\n📍 Departamento: ${getSingle(pos?.departamento)?.nombre}\n👤 Posición: ${pos?.nombre}\n👔 Uniforme: ${config?.color_uniforme}\n✨ Servicio: ${config?.tipo_servicio}`;

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
                    title: 'Copiado',
                    message: 'Detalles del rol copiados al portapapeles (Tu navegador no soporta compartir nativo).',
                    color: 'blue'
                });
            } catch (err) {
                console.error('Error al copiar:', err);
            }
        }
    };

    const attendanceTrend = personalStats?.byMonth ?
        Object.values(personalStats.byMonth as any)
            .slice(-4)
            .map((m: any) => (m.asistio / (m.asistio + m.faltas || 1)) * 100) : [];

    const upcomingTrend = [2, 4, 3, 5, upcomingCount]; // Mock trend for upcoming

    return (
        <Container size="xl" py="md">
            <Stack gap="lg">
                {/* AI Conversational Widget */}
                {effectiveDeptId && <AiQueryWidget departmentId={effectiveDeptId} />}

                <Grid gutter="xl" align="stretch">
                    <Grid.Col span={{ base: 12, lg: 7 }} className="animate-fade-in card-stagger-1">
                        <Stack gap="lg" h="100%">
                            <WelcomeCard userName={userProfile?.usuario?.nombre || 'Servidor'} />
                            {nextService && dayjs(getSingle(nextService.configuracion_dia)?.fecha).isBefore(dayjs().add(2, 'day')) && (
                                <Alert
                                    variant="light"
                                    color="orange"
                                    title="Recordatorio de Servicio"
                                    icon={<IconAlertCircle size={16} />}
                                    radius="md"
                                    className="animate-pulse glass-card"
                                >
                                    ¡Tienes un servicio programado para {dayjs(getSingle(nextService.configuracion_dia)?.fecha).calendar(null, {
                                        sameDay: '[hoy]',
                                        nextDay: '[mañana]',
                                        nextWeek: 'dddd',
                                        lastDay: '[ayer]',
                                        lastWeek: '[el] dddd',
                                        sameElse: 'DD/MM/YYYY'
                                    })}! No olvides tu uniforme {getSingle(nextService.configuracion_dia)?.color_uniforme}.
                                </Alert>
                            )}
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, lg: 5 }} className="animate-fade-in card-stagger-2">
                        <UpcomingServiceCard
                            nextService={nextService}
                            serverName={userProfile?.usuario ? `${(userProfile.usuario as any).nombre} ${(userProfile.usuario as any).apellido}` : ''}
                        />
                    </Grid.Col>
                </Grid>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} verticalSpacing="xl">
                    <Box className="animate-fade-in card-stagger-2">
                        <StatCard
                            title="Mi Asistencia"
                            value={`${personalRate}%`}
                            subtitle={`Tu promedio ${dayjs().year()}`}
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
                            trendData={upcomingTrend}
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

                <Grid gutter="xl">
                    <Grid.Col span={{ base: 12, md: 8 }} className="animate-fade-in card-stagger-3">
                        <Card withBorder p="md" radius="md" className="animate-fade-in hover-card">
                            <Group justify="space-between" mb="xl">
                                <Title order={4} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, color: 'var(--mantine-color-orange-7)' }}>Mis Próximos Servicios</Title>
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
                                <Stack gap="xs">
                                    {upcoming.map((service: any) => {
                                        const configDia = getSingle(service.configuracion_dia);
                                        const pos = getSingle(service.posicion);
                                        const dept = getSingle(pos?.departamento);
                                        return (
                                            <Card key={service.id} withBorder padding="sm" radius="md" style={{
                                                background: 'var(--mantine-bg-tint, rgba(217, 119, 6, 0.05))',
                                                borderColor: 'var(--mantine-color-default-border)'
                                            }}>
                                                <Group justify="space-between">
                                                    <Stack gap={0}>
                                                        <Group gap={6}>
                                                            <Text size="xs" fw={700} c="gold.6" tt="uppercase">{dept?.nombre}</Text>
                                                        </Group>
                                                        <Text fw={600} c="stone.3">{configDia?.tipo_servicio}</Text>
                                                        <Text size="sm" c="stone.5">
                                                            {dayjs(configDia?.fecha).format('dddd, D [de] MMMM')}
                                                        </Text>
                                                    </Stack>
                                                    <Group>
                                                        <Badge color="stone" variant="light">{pos?.nombre}</Badge>
                                                        <Badge color={getUniformeColor(configDia?.color_uniforme)} variant="filled">
                                                            {configDia?.color_uniforme}
                                                        </Badge>
                                                    </Group>
                                                </Group>
                                            </Card>
                                        )
                                    })}
                                </Stack>
                            ) : (
                                <Stack align="center" py="xl" gap="xs">
                                    <IconCalendarOff size={40} color="var(--mantine-color-dimmed)" stroke={1.5} />
                                    <Text ta="center" c="dimmed">No tienes asignaciones programadas próximamente.</Text>
                                </Stack>
                            )}
                        </Card>
                    </Grid.Col>

                    {attendanceManagedDepartments && attendanceManagedDepartments.length > 1 && (
                        <Grid.Col span={12}>
                            <Group justify="center" mb="md">
                                <Select
                                    label="Departamento para Estadísticas"
                                    placeholder="Selecciona un departamento"
                                    data={attendanceManagedDepartments
                                        .filter((d, index, self) =>
                                            index === self.findIndex(dept => dept.id === d.id)
                                        )
                                        .map(d => ({
                                            value: String(d.id),
                                            label: d.nombre
                                        }))}
                                    value={selectedDeptId ? String(selectedDeptId) : null}
                                    onChange={(val: string | null) => setSelectedDeptId(val ? Number(val) : null)}
                                    w={300}
                                    size="md"
                                    styles={{
                                        label: { fontWeight: 700, color: '#78716c' }
                                    }}
                                />
                            </Group>
                        </Grid.Col>
                    )}

                    {/* Stats personales — siempre visible */}
                    <Grid.Col span={{ base: 12, md: isLeader ? 6 : 4 }} className="animate-fade-in card-stagger-4">
                        <Card withBorder p="xl" radius="lg" className="hover-card shadow-sm" h="100%">
                            <Group justify="space-between" mb="xs">
                                <Title order={4} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, color: 'var(--mantine-color-text)' }}>
                                    Mi Estado de Asistencia
                                </Title>
                            </Group>
                            <Text size="xs" c="dimmed" fw={600} mb="lg">Tus registros de asistencia en el período actual</Text>
                            {personalStats ? (
                                <Stack gap="md">
                                    <Box w="100%" h={180} style={{ minWidth: 0 }}>
                                        <DonutChart h={180} data={[
                                            { name: 'Asistió', value: personalStats.summary.asistio, color: 'teal.6' },
                                            { name: 'Justificado', value: personalStats.summary.faltoConAviso, color: 'yellow.6' },
                                            { name: 'Faltó', value: personalStats.summary.faltoSinAviso, color: 'red.6' },
                                        ]} tooltipDataSource="segment" withLabelsLine withLabels />
                                    </Box>
                                    <Divider />
                                    <Stack gap={6}>
                                        <Group justify="space-between">
                                            <Group gap={6}><ThemeIcon color="teal" variant="light" size="sm" radius="xl"><Box w={6} h={6} style={{ borderRadius: '50%', background: 'var(--mantine-color-teal-6)' }} /></ThemeIcon><Text size="sm" fw={600}>Asistió</Text></Group>
                                            <Badge color="teal" variant="filled" size="md">{personalStats.summary.asistio}</Badge>
                                        </Group>
                                        <Group justify="space-between">
                                            <Group gap={6}><ThemeIcon color="yellow" variant="light" size="sm" radius="xl"><Box w={6} h={6} style={{ borderRadius: '50%', background: 'var(--mantine-color-yellow-6)' }} /></ThemeIcon><Text size="sm" fw={600}>Justificado</Text></Group>
                                            <Badge color="yellow" variant="filled" size="md">{personalStats.summary.faltoConAviso}</Badge>
                                        </Group>
                                        <Group justify="space-between">
                                            <Group gap={6}><ThemeIcon color="red" variant="light" size="sm" radius="xl"><Box w={6} h={6} style={{ borderRadius: '50%', background: 'var(--mantine-color-red-6)' }} /></ThemeIcon><Text size="sm" fw={600}>Faltó</Text></Group>
                                            <Badge color="red" variant="filled" size="md">{personalStats.summary.faltoSinAviso}</Badge>
                                        </Group>
                                        <Group justify="space-between" pt={4}>
                                            <Text size="xs" c="dimmed" fw={700}>Total registros</Text>
                                            <Text size="sm" fw={800}>{personalStats.summary.total}</Text>
                                        </Group>
                                    </Stack>
                                </Stack>
                            ) : (
                                <Stack align="center" py="xl" gap="xs">
                                    <IconUsers size={40} color="var(--mantine-color-dimmed)" stroke={1.5} />
                                    <Text ta="center" c="dimmed">No hay datos de asistencia todavía.</Text>
                                </Stack>
                            )}
                        </Card>
                    </Grid.Col>

                    {/* Stats de departamento — solo para líderes */}
                    {isLeader && (
                        <Grid.Col span={{ base: 12, md: 6 }} className="animate-fade-in card-stagger-5">
                            <Card withBorder p="xl" radius="lg" className="hover-card shadow-sm" h="100%">
                                <Group justify="space-between" mb="xs">
                                    <Title order={4} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, color: 'var(--mantine-color-text)' }}>
                                        Estado del Departamento
                                    </Title>
                                    <Badge color="orange" variant="light" size="lg" radius="md">Vista Líder</Badge>
                                </Group>
                                <Text size="xs" c="dimmed" fw={600} mb="lg">Registros de asistencia del equipo en el período actual</Text>
                                {deptStats ? (
                                    <Stack gap="md">
                                        <Box w="100%" h={180} style={{ minWidth: 0 }}>
                                            <DonutChart h={180} data={[
                                                { name: 'Asistió', value: deptStats.summary.asistio, color: 'teal.6' },
                                                { name: 'Justificado', value: deptStats.summary.faltoConAviso, color: 'yellow.6' },
                                                { name: 'Faltó', value: deptStats.summary.faltoSinAviso, color: 'red.6' },
                                            ]} tooltipDataSource="segment" withLabelsLine withLabels />
                                        </Box>
                                        <Divider />
                                        <Stack gap={6}>
                                            <Group justify="space-between">
                                                <Text size="xs" c="dimmed" fw={700}>Tasa general</Text>
                                                <Badge color="teal" variant="light" size="md">{deptRate}%</Badge>
                                            </Group>
                                            <Group justify="space-between">
                                                <Text size="xs" c="dimmed" fw={700}>Total registros</Text>
                                                <Text size="sm" fw={800}>{deptStats.summary.total}</Text>
                                            </Group>
                                        </Stack>
                                        <Button variant="light" color="gold" size="xs" radius="md" rightSection={<IconArrowRight size={14} />} onClick={() => navigate('/analytics')} fullWidth mt={4}>
                                            Ver detalle
                                        </Button>
                                    </Stack>
                                ) : (
                                    <Stack align="center" py="xl" gap="xs">
                                        <IconUsers size={40} color="var(--mantine-color-dimmed)" stroke={1.5} />
                                        <Text ta="center" c="dimmed">No hay datos del departamento todavía.</Text>
                                    </Stack>
                                )}
                            </Card>
                        </Grid.Col>
                    )}


                </Grid>
            </Stack>

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
