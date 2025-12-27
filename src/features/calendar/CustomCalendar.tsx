import { useMemo } from 'react';
import { Box, Group, Title, Button } from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { CalendarCard } from './components/CalendarCard';
import { ServiceUniformRow } from './components/ServiceUniformRow';
import { ServersList } from './components/ServersList';
import { EmptyState } from '../../components/EmptyState';
import { IconCalendarOff } from '@tabler/icons-react';

dayjs.locale('es');

interface CustomCalendarProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    groupedAssignments: Record<string, any>; // TODO: typed properly
    onDayClick: (date: Date, assignments: any[]) => void;
}

export function CustomCalendar({ currentDate, onDateChange, groupedAssignments, onDayClick }: CustomCalendarProps) {
    // Filtrar solo días con asignaciones del mes actual
    const daysWithAssignments = useMemo(() => {
        const startMonth = dayjs(currentDate).startOf('month');

        return Object.entries(groupedAssignments)
            .filter(([fecha]) => {
                const d = dayjs(fecha);
                return d.isSame(startMonth, 'month');
            })
            .map(([fecha, dayData]) => {
                const assignmentsWithEncargado = [...dayData.assignments];
                if (dayData.encargado && String(dayData.encargado).trim() !== '') {
                    assignmentsWithEncargado.push({
                        id: `encargado-${fecha}`,
                        usuario_id: dayData.encargado_id || 'encargado',
                        nombre: dayData.encargado,
                        posicion: 'Encargado',
                    });
                }

                return {
                    fecha,
                    date: dayjs(fecha),
                    assignments: assignmentsWithEncargado,
                    encargado: dayData.encargado,
                    servicio: dayData.servicio,
                    uniforme: dayData.uniforme,
                    isToday: dayjs(fecha).isSame(dayjs(), 'day'),
                    dayOfWeek: dayjs(fecha).format('dddd')
                };
            })
            .sort((a, b) => a.date.diff(b.date));
    }, [currentDate, groupedAssignments]);

    return (
        <Box>
            {/* Header con navegación */}
            <Group justify="space-between" mb="lg" align="center">
                <Title order={3}>
                    {dayjs(currentDate).format('MMMM [de] YYYY')}
                </Title>
                <Group>
                    <Button
                        variant="default"
                        onClick={() => onDateChange(dayjs(currentDate).subtract(1, 'month').toDate())}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => onDateChange(new Date())}
                    >
                        Hoy
                    </Button>
                    <Button
                        variant="default"
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
                    description="Crea un nuevo rol en el Planificador para ver las asignaciones aquí"
                    actionLabel="Ir al Planificador"
                    actionPath="/planning"
                    onAction={() => { }}
                />
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '16px',
                    width: '100%'
                }}>
                    {daysWithAssignments.map((cell) => (
                        <CalendarCard
                            key={cell.fecha}
                            date={cell.date}
                            dayOfWeek={cell.dayOfWeek}
                            assignmentsCount={cell.assignments.length}
                            isToday={cell.isToday}
                            onClick={() => onDayClick(cell.date.toDate(), cell.assignments)}
                        >
                            <ServiceUniformRow servicio={cell.servicio} uniforme={cell.uniforme} />
                            <ServersList assignments={cell.assignments} />
                        </CalendarCard>
                    ))}
                </div>
            )}
        </Box>
    );
}
