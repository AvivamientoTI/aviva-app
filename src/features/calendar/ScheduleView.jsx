  // Mostrar el JWT actual para depuración
  supabase.auth.getSession().then(({ data }) => {
    console.log('[ScheduleView] JWT actual:', data.session?.access_token);
  });
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './ScheduleView.css';
import { supabase } from '../../services/supabaseClient';
import { assignmentsService } from '../../services/assignmentsService';
import { Button, Group, Select, Box, Title, Modal, Text, Table, Badge, Tabs, Stack, Paper, Center, Grid, Container } from '@mantine/core';
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

const localizer = dayjsLocalizer(dayjs);

const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este rango',
  showMore: total => `+ Ver más (${total})`
};

// Evento compacto para vista mensual: muestra Nombre + Posición con tipografía pequeña
function CompactEvent({ event }) {
  const nombre = event?.resource?.usuario
    ? `${event.resource.usuario.nombre} ${event.resource.usuario.apellido}`
    : undefined;
  const posicion = event?.resource?.posicion?.nombre;
  const title = nombre && posicion ? `${nombre} — ${posicion}` : (event.title || 'Evento');
  const uniformColor = event?.resource?.configuracion_dia?.color_uniforme || 'gray';

  return (
    <Group gap="xs" align="center" wrap="nowrap">
      <Badge color={uniformColor} size="sm" circle />
      <div style={{
        fontSize: 11,
        lineHeight: 1.2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {title}
      </div>
    </Group>
  );
}

export function ScheduleView() {
  const permissions = usePermissions();
  const [selectedDept, setSelectedDept] = useState("");
  const [departments, setDepartments] = useState([]);
  const { userMemberships } = useUser();
  const { exportToPng } = useExport();
  const { groupedAssignments, loading, refetch } = useAssignments(selectedDept);
  // Validar si el usuario puede modificar el calendario (líder o sublíder)
  const puedeModificar = permissions.canModifyAssignments(selectedDept);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [dayEventsOpened, { open: openDayEvents, close: closeDayEvents }] = useDisclosure(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [users, setUsers] = useState([]);
  const [swapOpened, { open: openSwap, close: closeSwap }] = useDisclosure(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [savingSwap, setSavingSwap] = useState(false);
  const [allAssignedUsersOnDay, setAllAssignedUsersOnDay] = useState([]);
  const [loadingAssignedUsers, setLoadingAssignedUsers] = useState(false);
  const calendarRef = useRef(null);
  const detailRef = useRef(null);
  const monthExportRef = useRef(null);

  // DEBUG: Mostrar membresías y asignaciones agrupadas en consola después de inicializar todos los hooks
    console.log('userMemberships:', userMemberships);
    console.log('groupedAssignments:', groupedAssignments);
    // Log extra: usuario autenticado
    const { user } = useUser(); // Assuming useUser provides the user object
    if (user) {
      console.log('[ScheduleView] Usuario autenticado:', user.id, user.email, user);
    } else {
      console.warn('[ScheduleView] No hay usuario autenticado');
    }
  // Cargar departamentos al montar
  useEffect(() => {
    // Filtrar departamentos solo asociados al usuario
    const options = (userMemberships || [])
      .map(m => m.departamento)
      .filter((d, i, arr) => d && arr.findIndex(dd => dd.id === d.id) === i)
      .map(dep => ({ value: String(dep.id), label: dep.nombre }));
    setDepartments(options);
  }, [userMemberships]);
  // Efecto para inicializar selectedDept cuando se cargan los departamentos
  useEffect(() => {
    if (departments.length > 0 && !selectedDept) {
      setSelectedDept(departments[0].value);
    }
  }, [departments, selectedDept]);


  // Exportar calendario o detalle como PNG
  const handleExport = useCallback(() => {
    const fileName = viewMode === 'calendar' ? 'calendario-ujieres.png' : 'detalle-asignaciones.png';
    const exportRef = viewMode === 'calendar' ? calendarRef : detailRef;
    exportToPng(exportRef, fileName);
  }, [viewMode, exportToPng]);


  // Opciones de usuarios disponibles para swap
  const userOptions = useAvailableUsersForSwap(users, swapTarget, allAssignedUsersOnDay, loadingAssignedUsers);

  // Cargar usuarios del departamento seleccionado cuando se abre el modal de swap o cambia el departamento
  useEffect(() => {
    const fetchUsers = async () => {
      if (!selectedDept || !swapOpened) return;
      setLoadingAssignedUsers(true);
      try {
        // Usar attendanceService para obtener miembros del departamento
        const members = await (await import('../../services/attendanceService')).attendanceService.fetchDeptMembers(selectedDept);
        // Los miembros ya tienen 'roles' y 'genero' correctamente
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
  const handleOpenSwap = (event) => {
    setSwapTarget(event);
    openSwap();
  };

  // Función para guardar el cambio de servidor(a)
  const handleSwap = async () => {
    if (!selectedUserId || !swapTarget) return;
    setSavingSwap(true);
    try {
      // Realizar el cambio en la base de datos
      await assignmentsService.swap(swapTarget.id, selectedUserId);
      notifications.show({ title: 'Éxito', message: 'Cambio realizado correctamente', color: 'green' });
      closeSwap();
      setSelectedUserId(null);
      setSwapTarget(null);
      // Refrescar los datos de asignaciones
      refetch();
    } catch (error) {
      notifications.show({ title: 'Error', message: error.message, color: 'red' });
    } finally {
      setSavingSwap(false);
    }
  };
    useEffect(() => {
      if (departments.length > 0 && !selectedDept) {
        setSelectedDept(departments[0].value);
      }
    }, [departments, selectedDept]);
// ...existing code...

  const departmentName = useMemo(() => {
    const found = departments.find(d => d.value === selectedDept);
    return found?.label || 'Departamento';
  }, [departments, selectedDept]);

  // Construir matriz de días (7x6) del mes visible
  const monthCells = useMemo(() => {
    const startMonth = dayjs(currentDate).startOf('month');
    const endMonth = dayjs(currentDate).endOf('month');
    // Lunes como primer día (0..6)
    const startWeekday = (startMonth.day() + 6) % 7; // 0 si lunes, 6 si domingo
    const firstCell = startMonth.subtract(startWeekday, 'day');
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = firstCell.add(i, 'day');
      const key = d.format('YYYY-MM-DD');
      const dayData = groupedAssignments[key];
      cells.push({
        date: d,
        key,
        inMonth: d.isSame(startMonth, 'month'),
        dayOfWeek: d.format('dddd'),
        assignments: dayData ? dayData.assignments : [],
        encargado: dayData ? dayData.encargado : null,
        servicio: dayData ? dayData.servicio : 'N/A',
        uniforme: dayData ? dayData.uniforme : 'N/A'
      });
    }
    return { startMonth, endMonth, cells };
  }, [currentDate, groupedAssignments]);

  const handleExportMonthly = useCallback(() => {
    const fileName = `rol-mensual-${dayjs(currentDate).format('YYYY-MM')}.png`;
    exportToPng(monthExportRef, fileName);
  }, [currentDate, exportToPng]);

  const handleDeleteAssignment = async () => {
    if (!selectedEvent) return;

    try {
      await assignmentsService.delete(selectedEvent.id);
      notifications.show({ title: 'Éxito', message: 'Asignación eliminada', color: 'green' });
      close();
      refetch();
    } catch (error) {
      notifications.show({ title: 'Error', message: error.message, color: 'red' });
    }
  };

  return (
    <Container size="xl" py="xl">
      <Group mb="md" justify="space-between">
        <Title order={2}>Calendario de Servicios</Title>
        <Group>
          <Select
            placeholder="Selecciona Departamento"
            data={departments}
            value={selectedDept}
            onChange={setSelectedDept}
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
            <Box ref={calendarRef} p="md" style={{ backgroundColor: 'white' }}>
              <CustomCalendar
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                groupedAssignments={groupedAssignments}
                onDayClick={puedeModificar ? (date, assignments) => {
                  setSelectedDayEvents(assignments.map((asig) => ({
                    ...asig,
                    id: asig.id,
                    usuario_id: asig.usuario_id,
                    resource: {
                      usuario: { nombre: asig.nombre, apellido: '' },
                      posicion: { nombre: asig.posicion },
                      configuracion_dia: { color_uniforme: asig.uniforme, tipo_servicio: asig.servicio }
                    }
                  })));
                  setSelectedDate(date);
                  openDayEvents();
                } : undefined}
              />
            </Box>
          </Tabs.Panel>


          <Tabs.Panel value="detail">
            <Box ref={detailRef} p="md" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f1f3f5 100%)', borderRadius: 12 }}>
              <Stack gap="xl">
                {Object.keys(groupedAssignments).length === 0 ? (
                  <Text c="dimmed" ta="center">No hay asignaciones para este departamento</Text>
                ) : (
                  Object.entries(groupedAssignments).map(([fecha, dayData]) => (
                    <Paper key={fecha} p="lg" radius="md" shadow="sm" withBorder style={{ background: '#fff', borderLeft: '6px solid #228be6' }}>
                      <Group justify="space-between" mb="md">
                        <Group gap="sm">
                          <Title order={4} c="blue.8">{dayjs(fecha).format('dddd, DD [de] MMMM [de] YYYY')}</Title>
                          <Badge size="lg" color="orange" variant="filled" radius="sm">{dayData.servicio || 'N/A'}</Badge>
                        </Group>
                        <Badge size="lg" color="gray" variant="light" radius="sm">
                          {dayData.assignments.length} servidor{dayData.assignments.length !== 1 ? 'es(as)' : '(a)'}
                        </Badge>
                      </Group>
                      {dayData.encargado && (
                        <Paper p="sm" mb="md" style={{ backgroundColor: '#fffbe6', border: '1.5px solid #ffe066' }}>
                          <Group gap="xs">
                            <Text size="sm" fw={700} c="yellow.9">Encargado(a):</Text>
                            <Text size="sm" fw={600} c="yellow.9">{dayData.encargado}</Text>
                          </Group>
                        </Paper>
                      )}
                      <Table highlightOnHover striped withColumnBorders withRowBorders style={{ borderRadius: 8, overflow: 'hidden' }}>
                        <Table.Thead style={{ position: 'sticky', top: 0, background: '#f1f3f5', zIndex: 1 }}>
                          <Table.Tr>
                            <Table.Th style={{ width: '30%' }}>Servidor(a)</Table.Th>
                            <Table.Th style={{ width: '25%' }}>Posición</Table.Th>
                            <Table.Th style={{ width: '25%' }}>Uniforme</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {dayData.assignments.map((asig) => {
                            // Log para depuración de ids
                            console.log('asig.usuario_id:', asig.usuario_id, 'asig.departamento_id:', asig.departamento_id);
                            (userMemberships || []).forEach(m => {
                              console.log('membership.usuario_id:', m.usuario_id, 'membership.departamento?.id:', m.departamento?.id);
                            });
                            // Buscar el rol mensual del usuario en el departamento de la asignación (forzar string)
                            let rolMensual = '';
                            const membership = (userMemberships || []).find(m =>
                              String(m.usuario_id) === String(asig.usuario_id) &&
                              String(m.departamento?.id) === String(asig.departamento_id)
                            );
                            if (membership) {
                              const rawRol = membership.rol_jerarquico ? membership.rol_jerarquico.trim().toLowerCase() : '';
                              if (!rawRol || rawRol === 'servidor') {
                                rolMensual = 'Servidor';
                              } else {
                                rolMensual = membership.rol_jerarquico;
                              }
                            }
                            return (
                              <Table.Tr key={asig.id}>
                                <Table.Td fw={600} style={{ fontSize: 15 }}>{asig.nombre}</Table.Td>
                                <Table.Td>
                                  <Badge variant="filled" color="blue" size="md" radius="sm">{asig.posicion}</Badge>
                                </Table.Td>
                                <Table.Td>
                                  <Badge color="grape" size="md" radius="sm">{asig.uniforme}</Badge>
                                </Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </Paper>
                  ))
                )}
              </Stack>
            </Box>
          </Tabs.Panel>
        </Tabs>
      )}

      <Modal opened={opened} onClose={close} title="Detalles de Asignación">
        {selectedEvent && (
          <>
            <Text size="lg" fw={500} mb="xs">{selectedEvent.title}</Text>
            <Text size="sm" c="dimmed" mb="xs">
              Fecha: {dayjs(selectedEvent.start).format('DD/MM/YYYY')}
            </Text>
            <Text size="md" fw={600} c="orange" mb="md">
              Tipo de servicio: <span style={{ fontSize: '18px' }}>{selectedEvent.resource?.configuracion_dia?.tipo_servicio || 'N/A'}</span>
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={close}>Cerrar</Button>
              <Button color="red" onClick={handleDeleteAssignment} disabled={!permissions.canModifyAssignments(selectedDept)}>
                Eliminar Asignación
              </Button>
            </Group>
          </>
        )}
      </Modal>
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
                      <Badge variant="dot" color="blue">
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

      <Modal opened={swapOpened} onClose={closeSwap} title="Cambiar servidor(a)" centered>
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Selecciona un(a) servidor(a) disponible para esta asignación.
          </Text>
          <Group justify="space-between" gap="xs">
            <Text size="sm" fw={600}>
              Disponibles: {userOptions.length}
            </Text>
            <Text size="xs" c="dimmed">
              (excluye los ya asignados ese día)
            </Text>
          </Group>
          <Select
            placeholder="Elige servidor(a) disponible"
            data={userOptions}
            value={selectedUserId}
            onChange={setSelectedUserId}
            searchable
            nothingFoundMessage={userOptions.length === 0 ? "No hay servidores(as) disponibles ese día" : undefined}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeSwap}>Cancelar</Button>
            <Button loading={savingSwap} onClick={handleSwap} disabled={!selectedUserId}>Guardar cambio</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
