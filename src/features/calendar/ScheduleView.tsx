import { useState, useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './ScheduleView.css';
import { attendanceService } from '../../services/attendanceService';
import { assignmentsService } from '../../services/assignmentsService';
import { Button, Group, Select, Box, Title, Modal, Text, Table, Badge, Tabs, Stack, Container } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCalendar, IconList } from '@tabler/icons-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useUser } from '../../contexts/UserContext';
import { CustomCalendar } from './CustomCalendar';
import { useAssignments } from './hooks/useAssignments';
import { useExport } from './hooks/useExport';
import { useAvailableUsersForSwap } from './hooks/useAvailableUsersForSwap';
import { CalendarSkeleton } from '../../components/SkeletonLoaders';
import { SwapServerModal } from './components/SwapServerModal';
import { AssignmentDetailModal } from './components/AssignmentDetailModal';
import { DetailedListTab } from './components/DetailedListTab';

export function ScheduleView() {
    const permissions = usePermissions();
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
    const { userMemberships } = useUser();
    const { exportToPng } = useExport();
    const {
        groupedAssignments,
        loading,
        deleteAssignment,
        swapAssignment
    } = useAssignments(selectedDept);

    // Validar si el usuario puede modificar el calendario (líder o sublíder)
    const puedeModificar = permissions.canModifyAssignments(selectedDept);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [opened, { open, close }] = useDisclosure(false);
    const [dayEventsOpened, { open: openDayEvents, close: closeDayEvents }] = useDisclosure(false);
    const [selectedDayEvents, setSelectedDayEvents] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<string | null>('calendar');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [users, setUsers] = useState<any[]>([]);
    const [swapOpened, { open: openSwap, close: closeSwap }] = useDisclosure(false);
    const [swapTarget, setSwapTarget] = useState<any>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [allAssignedUsersOnDay, setAllAssignedUsersOnDay] = useState<any[]>([]);
    const [loadingAssignedUsers, setLoadingAssignedUsers] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);
    const detailRef = useRef<HTMLDivElement>(null);

    // Cargar departamentos al montar
    useEffect(() => {
        // Filtrar departamentos solo asociados al usuario
        const options = (userMemberships || [])
            .map(m => m.departamento)
            .filter((d): d is NonNullable<typeof d> => !!d) // Ensure d is not null/undefined
            .filter((d, i, arr) => arr.findIndex(dd => dd?.id === d.id) === i)
            .map(dep => ({ value: String(dep.id), label: dep.nombre }));
        setDepartments(options);
    }, [userMemberships]);

    // Efecto para inicializar selectedDept
    useEffect(() => {
        if (departments.length > 0 && !selectedDept) {
            setSelectedDept(departments[0].value);
        }
    }, [departments, selectedDept]);

    // Exportar calendario o detalle como PNG
    const handleExport = useCallback(() => {
        const fileName = viewMode === 'calendar' ? 'calendario-servidores.png' : 'detalle-asignaciones.png';
        const exportRef = viewMode === 'calendar' ? calendarRef : detailRef;
        // We cast the ref because exportToPng expects a MutableRefObject
        exportToPng(exportRef as any, fileName);
    }, [viewMode, exportToPng]);

    // Opciones de usuarios disponibles para swap
    const userOptions = useAvailableUsersForSwap(users, swapTarget, allAssignedUsersOnDay, loadingAssignedUsers);

    // Cargar usuarios del departamento seleccionado
    useEffect(() => {
        const fetchUsers = async () => {
            if (!selectedDept || !swapOpened) return;
            setLoadingAssignedUsers(true);
            try {
                const members = await attendanceService.fetchDeptMembers(selectedDept);
                setUsers(members);
            } catch (err) {
                setUsers([]);
            } finally {
                setLoadingAssignedUsers(false);
            }
        };
        fetchUsers();
    }, [selectedDept, swapOpened]);

    // Función para abrir el modal de swap y establecer el target
    const handleOpenSwap = (event: any) => {
        setSwapTarget(event);
        openSwap();
    };

    // Función para guardar el cambio de servidor(a)
    const handleSwap = () => {
        if (!selectedUserId || !swapTarget) return;

        swapAssignment.mutate(
            { assignmentId: swapTarget.id, newUserId: selectedUserId },
            {
                onSuccess: () => {
                    notifications.show({ title: 'Éxito', message: 'Cambio realizado correctamente', color: 'green' });
                    closeSwap();
                    setSelectedUserId(null);
                    setSwapTarget(null);
                },
                onError: (error: any) => {
                    notifications.show({ title: 'Error', message: error.message || 'Error al cambiar asignación', color: 'red' });
                }
            }
        );
    };

    // Manejar click en evento para ver detalles
    const handleSelectEvent = (event: any) => {
        setSelectedEvent(event);
        open();
    };

    const handleDeleteAssignment = () => {
        if (!selectedEvent) return;

        deleteAssignment.mutate(selectedEvent.id, {
            onSuccess: () => {
                notifications.show({ title: 'Éxito', message: 'Asignación eliminada', color: 'green' });
                close();
            },
            onError: (error: any) => {
                notifications.show({ title: 'Error', message: error.message || 'Error al eliminar', color: 'red' });
            }
        });
    };

    return (
        <Container size="xl" py="xl">
            <Group mb="md" justify="space-between" align="center" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '1rem' }}>
                <Title order={2}>Calendario de Servicios</Title>
                <Group>
                    <Select
                        placeholder="Selecciona Departamento"
                        data={departments}
                        value={selectedDept}
                        onChange={setSelectedDept}
                        w={{ base: '100%', sm: 'auto' }}
                    />
                    <Button onClick={handleExport}>Exportar a PNG</Button>
                </Group>
            </Group>

            {loading ? (
                <CalendarSkeleton />
            ) : (
                <Tabs value={viewMode} onChange={setViewMode}>
                    <Tabs.List mb="md">
                        <Tabs.Tab value="calendar" leftSection={<IconCalendar size={16} />}>
                            Vista Calendario
                        </Tabs.Tab>
                        <Tabs.Tab value="detail" leftSection={<IconList size={16} />}>
                            Vista Detallada
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="calendar">
                        <Box ref={calendarRef} p="md" bg="white">
                            <CustomCalendar
                                currentDate={currentDate}
                                onDateChange={setCurrentDate}
                                groupedAssignments={groupedAssignments}
                                onDayClick={puedeModificar ? async (date, assignments) => {
                                    setSelectedDayEvents(assignments.map((asig) => ({
                                        ...asig,
                                        id: asig.id,
                                        usuario_id: asig.usuario_id,
                                        posicionObj: asig.posicionObj,
                                        resource: {
                                            usuario: { nombre: asig.nombre, apellido: '' },
                                            posicion: { nombre: asig.posicion },
                                            configuracion_dia: { color_uniforme: asig.uniforme, tipo_servicio: asig.servicio }
                                        }
                                    })));

                                    // Fetch ALL assigned users for this day across all departments
                                    try {
                                        const globalAssignments = await assignmentsService.fetchUsersByDate(dayjs(date).format('YYYY-MM-DD'));
                                        setAllAssignedUsersOnDay(globalAssignments.map(a => a.usuario_id));
                                    } catch (err) {
                                        setAllAssignedUsersOnDay(assignments.map(a => a.usuario_id));
                                    }

                                    setSelectedDate(date);
                                    openDayEvents();
                                } : (() => { })}
                            />
                        </Box>
                    </Tabs.Panel>

                    <Tabs.Panel value="detail">
                        <Box ref={detailRef}>
                            <DetailedListTab
                                groupedAssignments={groupedAssignments}
                                userMemberships={userMemberships}
                            />
                        </Box>
                    </Tabs.Panel>
                </Tabs>
            )}

            <AssignmentDetailModal
                opened={opened}
                onClose={close}
                selectedEvent={selectedEvent}
                onDelete={handleDeleteAssignment}
                canModify={puedeModificar}
            />

            <Modal
                opened={dayEventsOpened}
                onClose={closeDayEvents}
                title={selectedDate ? `Servidores(as) del ${dayjs(selectedDate).format('dddd, DD [de] MMMM [de] YYYY')}` : 'Servidores(as) del día'}
                size="lg"
            >
                <Stack gap="sm">
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">
                            Total de asignaciones: {selectedDayEvents.length}
                        </Text>
                    </Group>
                    <Table highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Servidor(a)</Table.Th>
                                <Table.Th>Posición</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {selectedDayEvents.map((event) => {
                                const resource = event.resource;
                                const nombreCompleto = resource?.usuario ? `${resource.usuario.nombre} ${resource.usuario.apellido}` : event.nombre;
                                const posicionNombre = resource?.posicion?.nombre || event.posicion || 'Sin posición';
                                return (
                                    <Table.Tr key={event.id}>
                                        <Table.Td fw={500}>
                                            {nombreCompleto}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="dot" color="gold" c="gold.9">
                                                {posicionNombre}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs" justify="flex-end">
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    onClick={() => handleOpenSwap(event)}
                                                >
                                                    Cambiar
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="default"
                                                    onClick={() => {
                                                        closeDayEvents();
                                                        handleSelectEvent(event);
                                                    }}
                                                >
                                                    Ver detalles
                                                </Button>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeDayEvents}>Cerrar</Button>
                    </Group>
                </Stack>
            </Modal>

            <SwapServerModal
                opened={swapOpened}
                onClose={closeSwap}
                userOptions={userOptions}
                selectedUserId={selectedUserId}
                onSelectedUserIdChange={setSelectedUserId}
                onSwap={handleSwap}
                loading={swapAssignment.isPending}
            />
        </Container>
    );
}
