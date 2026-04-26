import { useMemo } from 'react';
import { Box, Group, Title, Button, Badge, Text } from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { CalendarCard } from './components/CalendarCard';
import { ServiceUniformRow } from './components/ServiceUniformRow';
import { ServersList } from './components/ServersList';
import { EmptyState } from '../../components/EmptyState';
import { formatTime12h } from '../../utils/timeFormat';
import { IconCalendarOff, IconClock } from '@tabler/icons-react';

dayjs.locale('es');

interface CustomCalendarProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    groupedAssignments: Record<string, any>; // TODO: typed properly
    onDayClick: (date: Date, assignments: any[]) => void;
    puedeModificar?: boolean;
}

export function CustomCalendar({ currentDate, onDateChange, groupedAssignments, onDayClick, puedeModificar = false }: CustomCalendarProps) {
    // Filtrar solo días con asignaciones del mes actual
    const daysWithAssignments = useMemo(() => {
        const startMonth = dayjs(currentDate).startOf('month');

        return Object.entries(groupedAssignments)
            .filter(([fecha]) => dayjs(fecha).isSame(startMonth, 'month'))
            .map(([fecha, dayData]) => ({
                fecha,
                date: dayjs(fecha),
                services: dayData.services,
                allAssignments: dayData.allAssignments,
                isToday: dayjs(fecha).isSame(dayjs(), 'day'),
                dayOfWeek: dayjs(fecha).format('dddd')
            }))
            .sort((a, b) => a.date.diff(b.date));
    }, [currentDate, groupedAssignments]);

    return (
        <Box>
            {/* Header con navegación */}
            <Group justify="space-between" mb="lg" align="center" wrap="wrap" gap="md">
                <Title order={3} style={{ flex: '1 1 auto', minWidth: '200px' }}>
                    {dayjs(currentDate).format('MMMM [de] YYYY')}
                </Title>
                <Group gap="xs" style={{ flex: '1 1 auto', justifyContent: 'flex-end' }}>
                    <Button
                        variant="default"
                        size="xs"
                        onClick={() => onDateChange(dayjs(currentDate).subtract(1, 'month').toDate())}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="default"
                        size="xs"
                        onClick={() => onDateChange(new Date())}
                    >
                        Hoy
                    </Button>
                    <Button
                        variant="default"
                        size="xs"
                        onClick={() => onDateChange(dayjs(currentDate).add(1, 'month').toDate())}
                    >
                        Siguiente
                    </Button>
                </Group>
            </Group>

            {/* Mostrar solo días con roles */}
            {daysWithAssignments.length === 0 ? (
                <EmptyState
                    icon={IconCalendarOff}
                    title="No hay roles asignados para este mes"
                    description={puedeModificar 
                        ? "Crea un nuevo rol en el Planificador para ver las asignaciones aquí" 
                        : "Pronto verás tu programación aquí. Mantente atento a las actualizaciones de tu líder."}
                    actionLabel={puedeModificar ? "Ir al Planificador" : undefined}
                    actionPath={puedeModificar ? "/planning" : undefined}
                    onAction={() => { }}
                />
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px',
                    width: '100%'
                }}>
                    {daysWithAssignments.map((cell) => (
                        <CalendarCard
                            key={cell.fecha}
                            date={cell.date}
                            dayOfWeek={cell.dayOfWeek}
                            assignmentsCount={cell.allAssignments.length}
                            isToday={cell.isToday}
                            onClick={() => onDayClick(cell.date.toDate(), cell.allAssignments)}
                        >
                            {cell.services.map((svc, svcIdx) => (
                                <Box key={svc.configuracion_dia_id} style={{
                                    borderTop: svcIdx > 0 ? '3px dashed var(--mantine-color-orange-3)' : undefined,
                                }}>
                                    {cell.services.length > 1 && (
                                        <Box
                                            px="md"
                                            py="sm"
                                            style={{
                                                background: svcIdx === 0
                                                    ? 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)'
                                                    : svcIdx === 1
                                                    ? 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)'
                                                    : 'linear-gradient(90deg, #f5f3ff 0%, #ede9fe 100%)',
                                                borderBottom: '1px solid',
                                                borderColor: svcIdx === 0 ? '#bfdbfe' : svcIdx === 1 ? '#fed7aa' : '#ddd6fe',
                                            }}
                                        >
                                            <Group gap="sm" align="center">
                                                <Badge
                                                    size="lg"
                                                    variant="filled"
                                                    color={svcIdx === 0 ? 'blue' : svcIdx === 1 ? 'orange' : 'violet'}
                                                    radius="sm"
                                                    style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.02em', padding: '4px 10px' }}
                                                >
                                                    {svcIdx === 0 ? '1er Servicio' : svcIdx === 1 ? '2do Servicio' : `Servicio ${svcIdx + 1}`}
                                                </Badge>
                                                {svc.hora_llegada && (
                                                    <Group gap={6} align="center">
                                                        <IconClock size={15} color={svcIdx === 0 ? '#1d4ed8' : svcIdx === 1 ? '#c2410c' : '#6d28d9'} />
                                                        <Text size="sm" fw={800} c={svcIdx === 0 ? 'blue.8' : svcIdx === 1 ? 'orange.8' : 'violet.8'}>
                                                            Llegada {formatTime12h(svc.hora_llegada)}
                                                        </Text>
                                                    </Group>
                                                )}
                                            </Group>
                                        </Box>
                                    )}
                                    <ServiceUniformRow servicio={svc.servicio} uniforme={svc.uniforme} hora_llegada={cell.services.length === 1 ? svc.hora_llegada : null} />
                                    <ServersList assignments={svc.assignments} />
                                </Box>
                            ))}
                        </CalendarCard>
                    ))}
                </div>
            )}
        </Box>
    );
}
