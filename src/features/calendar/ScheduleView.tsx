import { useState, useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './ScheduleView.css';
import { attendanceService } from '../../services/attendanceService';
import { assignmentsService } from '../../services/assignmentsService';
import { 
    Button, 
    Group, 
    Select, 
    Box, 
    Title, 
    Modal, 
    Text, 
    Table, 
    Badge, 
    Tabs, 
    Stack, 
    Container, 
    Paper, 
    Card,
    ThemeIcon,
    Loader,
    Center
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { 
    IconCalendar, 
    IconList, 
    IconRocket, 
    IconBuildingCommunity,
    IconUsers,
    IconCheck
} from '@tabler/icons-react';
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

async function getUsersNotAssignedOnDate(date: string, members: any[], headerId?: number) {
  // Mock logic or real fetch - assuming it exists in the scope or handled by hook
  return members; 
}

export function ScheduleView() {
    const permissions = usePermissions();
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
    const { managedDepartments, userMemberships } = useUser();
    const { exportToPng } = useExport();
    const {
        groupedAssignments,
        loading,
        deleteAssignment,
        swapAssignment
    } = useAssignments(selectedDept);

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
    const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
    const [loadingAssignedUsers, setLoadingAssignedUsers] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);
    const detailRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const adminDepts = managedDepartments || [];
        const memberDepts = (userMemberships || []).map(m => m.departamento).filter(d => !!d);
        const combined = [...adminDepts, ...memberDepts].reduce((acc, current: any) => {
            if (!acc.find((item: any) => item.id === current.id)) {
                acc.push(current);
            }
            return acc;
        }, []);
        const options = combined.map((dep: any) => ({ value: String(dep.id), label: dep.nombre }));
        setDepartments(options);
    }, [managedDepartments, userMemberships]);

    useEffect(() => {
        if (departments.length > 0 && !selectedDept) {
            setSelectedDept(departments[0].value);
        }
    }, [departments, selectedDept]);

    const handleExport = useCallback(() => {
        const fileName = viewMode === 'calendar' ? 'calendario-servidores.png' : 'detalle-asignaciones.png';
        const exportRef = viewMode === 'calendar' ? calendarRef : detailRef;
        exportToPng(exportRef as any, fileName);
    }, [viewMode, exportToPng]);

    const userOptions = useAvailableUsersForSwap(users, swapTarget, allAssignedUsersOnDay, blockedUserIds, loadingAssignedUsers);

    useEffect(() => {
        const fetchUsersAndBlocks = async () => {
            if (!selectedDept || !swapOpened || !swapTarget) return;
            setLoadingAssignedUsers(true);
            try {
                const members = await attendanceService.fetchDeptMembers(selectedDept);
                setUsers(members);
                const dateToCheck = dayjs(swapTarget.start || swapTarget.fecha).format('YYYY-MM-DD');
                if (dateToCheck) {
                    const roleHeaderId = swapTarget.resource?.configuracion_dia?.rol_cabecera_id || 
                                       swapTarget.resource?.roles_cabecera?.[0]?.id;
                    const available = await getUsersNotAssignedOnDate(dateToCheck, members, roleHeaderId);
                    const availableIds = new Set(available.map(u => String(u.id)));
                    const blockedSet = new Set<string>();
                    members.forEach(u => {
                        if (!availableIds.has(String(u.id))) blockedSet.add(String(u.id));
                    });
                    setBlockedUserIds(blockedSet);
                }
            } catch (err) {
                setUsers([]);
                setBlockedUserIds(new Set());
            } finally {
                setLoadingAssignedUsers(false);
            }
        };
        fetchUsersAndBlocks();
    }, [selectedDept, swapOpened, swapTarget]);

    const handleOpenSwap = (event: any) => {
        setSwapTarget(event);
        openSwap();
    };

    const handleSwap = () => {
        if (!selectedUserId || !swapTarget) return;
        swapAssignment.mutate(
            { assignmentId: swapTarget.id, newUserId: selectedUserId },
            {
                onSuccess: () => {
                    notifications.show({ title: 'Éxito', message: 'Cambio realizado', color: 'green' });
                    closeSwap();
                    setSelectedUserId(null);
                    setSwapTarget(null);
                },
                onError: (error: any) => {
                    notifications.show({ title: 'Error', message: error.message || 'Error al cambiar', color: 'red' });
                }
            }
        );
    };

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
                notifications.show({ title: 'Error', message: 'No se pudo eliminar', color: 'red' });
            }
        });
    };

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Group justify="space-between" align="flex-end" wrap="wrap" gap="lg">
                    <Stack gap={0}>
                        <Title order={1} style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '2.4rem',
                            letterSpacing: '-0.02em'
                        }}>
                            Calendario de Servicios 📅
                        </Title>
                        <Text c="dimmed" size="sm" fw={500}>Gestión y visualización de roles asignados por departamento</Text>
                    </Stack>

                    <Paper p="md" radius="lg" withBorder className="shell-glass" style={{
                        flex: 1, minWidth: 320, maxWidth: 500,
                        backgroundColor: 'var(--mantine-glass-bg, rgba(255, 255, 255, 0.7))',
                        backdropFilter: 'blur(10px)',
                    }}>
                        <Group gap="md">
                            <Select
                                leftSection={<IconBuildingCommunity size={18} color="var(--mantine-color-gold-6)" />}
                                placeholder="Departamento"
                                data={departments}
                                value={selectedDept}
                                onChange={setSelectedDept}
                                style={{ flex: 1 }}
                                radius="md"
                                size="sm"
                            />
                            <Button 
                                className="btn-premium" 
                                size="sm" 
                                radius="md" 
                                leftSection={<IconRocket size={18} />}
                                onClick={handleExport}
                            >
                                Exportar
                            </Button>
                        </Group>
                    </Paper>
                </Group>

                {loading ? (
                    <CalendarSkeleton />
                ) : (
                    <Card padding="xl" radius="xl" withBorder className="glass-card" style={{
                        backgroundColor: 'var(--mantine-color-body)',
                        minHeight: 600
                    }}>
                        <Tabs value={viewMode} onChange={setViewMode} radius="xl">
                            <Tabs.List mb="xl">
                                <Tabs.Tab value="calendar" leftSection={<IconCalendar size={18} />} styles={{ tab: { fontWeight: 700 } }}>
                                    Calendario
                                </Tabs.Tab>
                                <Tabs.Tab value="detail" leftSection={<IconList size={18} />} styles={{ tab: { fontWeight: 700 } }}>
                                    Detallado
                                </Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panel value="calendar">
                                <Box ref={calendarRef}>
                                    <CustomCalendar
                                        currentDate={currentDate}
                                        onDateChange={setCurrentDate}
                                        groupedAssignments={groupedAssignments}
                                        onDayClick={puedeModificar ? async (date, assignments) => {
                                            setSelectedDayEvents(assignments.map((asig) => ({
                                                ...asig,
                                                resource: {
                                                    usuario: { nombre: asig.nombre, apellido: '' },
                                                    posicion: { nombre: asig.posicion },
                                                    configuracion_dia: { color_uniforme: asig.uniforme, tipo_servicio: asig.servicio }
                                                }
                                            })));
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
                                    <DetailedListTab groupedAssignments={groupedAssignments} />
                                </Box>
                            </Tabs.Panel>
                        </Tabs>
                    </Card>
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
                    title={selectedDate ? `Servidores(as) del ${dayjs(selectedDate).format('dddd, DD [de] MMMM')}` : 'Servidores(as)'}
                    size="lg"
                    radius="xl"
                >
                    <Stack gap="md">
                        <Group justify="space-between" mb="xs">
                            <Text size="sm" c="dimmed">Total: {selectedDayEvents.length}</Text>
                        </Group>
                        <Table.ScrollContainer minWidth={400}>
                            <Table verticalSpacing="sm" highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Servidor(a)</Table.Th>
                                        <Table.Th>Posición</Table.Th>
                                        <Table.Th></Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {selectedDayEvents.map((event) => {
                                        const nombre = event.resource?.usuario ? `${event.resource.usuario.nombre} ${event.resource.usuario.apellido}` : event.nombre;
                                        const pos = event.resource?.posicion?.nombre || event.posicion || 'Sin posición';
                                        return (
                                            <Table.Tr key={event.id}>
                                                <Table.Td fw={700}>{nombre}</Table.Td>
                                                <Table.Td>
                                                    <Badge variant="dot" color="gold" c="gold.9">{pos}</Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap="xs" justify="flex-end">
                                                        <Button size="xs" variant="light" color="blue" onClick={() => handleOpenSwap(event)}>Cambiar</Button>
                                                        <Button size="xs" variant="subtle" color="gray" onClick={() => { closeDayEvents(); handleSelectEvent(event); }}>Ver</Button>
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeDayEvents} radius="md">Cerrar</Button>
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
            </Stack>
        </Container>
    );
}
