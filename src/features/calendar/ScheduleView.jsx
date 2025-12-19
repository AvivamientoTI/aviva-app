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
  return (
    <div style={{ fontSize: 11, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {title}
    </div>
  );
}

export function ScheduleView() {
  const permissions = usePermissions();
  const { loading: userLoading } = useUser();
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
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

  // Usar hooks personalizados
  const { groupedAssignments, calendarEvents: events, loading, refetch } = useAssignments(selectedDept);
  const { exportToPng } = useExport();

  useEffect(() => {
    // Esperar a que UserContext cargue antes de cargar departamentos
    if (!userLoading) {
      fetchDepartments();
    }
  }, [userLoading]);

  useEffect(() => {
    if (selectedDept) {
      fetchUsers(selectedDept);
    }
  }, [selectedDept, refetch]);

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departamentos').select('*');
    if (data) {
      // Obtener departamentos gestionados por el usuario
      const managedDeptIds = permissions.getManagedDepartmentIds();

      const manageable = data.filter(d => managedDeptIds.includes(d.id));

      // Si el usuario tiene departamentos específicos, mostrar solo esos
      // Si no (ej: admin), mostrar todos
      const departmentsToShow = manageable.length > 0 ? manageable : data;

      setDepartments(departmentsToShow.map(d => ({ value: String(d.id), label: d.nombre })));
      if (departmentsToShow.length > 0) {
        setSelectedDept(String(departmentsToShow[0].id));
      }
    }
  };

  const fetchUsers = async (deptId) => {
    const { data: deptMemberships, error } = await supabase
      .from('membresias')
      .select(`
        rol_jerarquico,
        usuario:usuarios(id, nombre, apellido, genero)
      `)
      .eq('departamento_id', Number(deptId));

    if (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Error cargando servidores(as)', color: 'red' });
    } else {
      const normalize = (str) => str?.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';

      const usersWithRolesMap = {};
      deptMemberships.forEach(m => {
        if (!m.usuario) return;
        const uid = m.usuario.id;
        if (!usersWithRolesMap[uid]) {
          usersWithRolesMap[uid] = {
            ...m.usuario,
            roles: []
          };
        }
        usersWithRolesMap[uid].roles.push(normalize(m.rol_jerarquico));
      });
      setUsers(Object.values(usersWithRolesMap));
    }
  };

  const handleExport = useCallback(() => {
    const fileName = viewMode === 'calendar' ? 'calendario-ujieres.png' : 'detalle-asignaciones.png';
    const exportRef = viewMode === 'calendar' ? calendarRef : detailRef;
    exportToPng(exportRef, fileName);
  }, [viewMode, exportToPng]);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    open();
  };

  const handleSelectSlot = (slotInfo) => {
    // Cuando se hace clic en una fecha del calendario, mostrar todos los servidores de ese día
    const selectedDateStr = dayjs(slotInfo.start).format('YYYY-MM-DD');
    const dayData = groupedAssignments[selectedDateStr];

    if (dayData && dayData.assignments.length > 0) {
      setSelectedDayEvents(dayData.assignments.map((asig) => ({
        ...asig,
        id: asig.id,
        usuario_id: asig.usuario_id,
        resource: {
          usuario: { nombre: asig.nombre, apellido: '' },
          posicion: { nombre: asig.posicion },
          configuracion_dia: { color_uniforme: asig.uniforme, tipo_servicio: asig.servicio }
        }
      })));
      setSelectedDate(slotInfo.start);
      openDayEvents();
    }
  };

  const handleShowMore = (events, date) => {
    // events viene como un array de eventos del día
    setSelectedDayEvents(events);
    setSelectedDate(date);
    openDayEvents();
  };

  const userOptions = useMemo(() => {
    // Si no hay un swap target, mostrar todos los usuarios del departamento
    if (!swapTarget) {
      return users.map(u => ({ value: String(u.id), label: `${u.nombre} ${u.apellido}` }));
    }

    // Si aún está cargando, retornar lista vacía temporalmente
    if (loadingAssignedUsers) {
      return [];
    }

    // Build set of IDs already assigned that day
    const assignedUserIdsOnDay = new Set(allAssignedUsersOnDay.map(id => String(id)));

    // Exclude current user from that set to allow them in the list
    const currentUserId = String(swapTarget.usuario_id);
    if (currentUserId) {
      assignedUserIdsOnDay.delete(currentUserId);
    }

    const normalize = (str) => str?.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';

    // Detection of Encargado position
    const posNameNorm = normalize(swapTarget?.resource?.posicion?.nombre || swapTarget?.posicion);
    const isEncargadoPos = posNameNorm.includes('encargad');

    // Filter users who are NOT assigned on that day and match role requirements
    const filteredUsers = users.filter(u => {
      const isExcluded = assignedUserIdsOnDay.has(String(u.id));
      if (isExcluded) return false;

      // 1. Gender check: allow same gender, or 'A' (Ambos) or if no requirement
      const requiredGender = swapTarget?.resource?.posicion?.genero_requerido || swapTarget?.posicion?.genero_requerido;
      const genderMatch = !requiredGender ||
        requiredGender === 'A' ||
        u.genero === requiredGender;

      if (!genderMatch) return false;

      // 2. Encargado logic: check roles
      if (isEncargadoPos) {
        return u.roles.some(r =>
          r.includes('lider') ||
          r.includes('encargad') ||
          r.includes('sublider')
        );
      }
      return true;
    });

    console.log(`✅ Usuarios disponibles: ${filteredUsers.length}/${users.length} (EncargadoPos: ${isEncargadoPos})`);

    return filteredUsers.map(u => ({ value: String(u.id), label: `${u.nombre} ${u.apellido}` }));
  }, [users, swapTarget, allAssignedUsersOnDay, selectedDate, loadingAssignedUsers]);

  const handleOpenSwap = async (event) => {
    setSwapTarget(event);
    setSelectedUserId(null);
    setLoadingAssignedUsers(true);

    const eventDate = selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : null;
    console.log('🔄 Abriendo modal - Cargando bloqueos (asig + ausencias) para:', eventDate);

    if (eventDate) {
      try {
        // Fetch all blocked users (assignments in other depts + absences) using the new RPC
        const { data: blockedResults, error } = await supabase.rpc('get_blocked_users', {
          p_date: eventDate
        });

        if (error) throw error;

        const blockedIds = (blockedResults || []).map(row => String(row.usuario_id));
        setAllAssignedUsersOnDay(blockedIds);
      } catch (err) {
        console.error('❌ Error fetching blocked users via RPC:', err);
        setAllAssignedUsersOnDay([]);
      } finally {
        setLoadingAssignedUsers(false);
      }
    } else {
      console.warn('⚠️ No hay fecha seleccionada');
      setAllAssignedUsersOnDay([]);
      setLoadingAssignedUsers(false);
    }

    openSwap();
  };

  const handleSwap = async () => {
    if (!swapTarget || !selectedUserId) return;

    // Defensive cross-department validation: avoid assigning if the user is already in another role that day
    const selectedUserIdStr = String(selectedUserId);
    const currentUserIdStr = swapTarget.usuario_id ? String(swapTarget.usuario_id) : null;

    // Create set excluding current user
    const blockedIdsExcludingCurrent = allAssignedUsersOnDay.filter(id =>
      currentUserIdStr === null || String(id) !== currentUserIdStr
    );

    const isUserAlreadyAssigned = blockedIdsExcludingCurrent.includes(selectedUserIdStr);

    console.log('🔒 Validación antes de guardar:', {
      selectedUserId: selectedUserIdStr,
      currentUserId: currentUserIdStr,
      allBlockedIds: allAssignedUsersOnDay,
      isBlocked: isUserAlreadyAssigned
    });

    if (isUserAlreadyAssigned) {
      const selectedUser = users.find(u => String(u.id) === selectedUserIdStr);
      const userName = selectedUser ? `${selectedUser.nombre} ${selectedUser.apellido}` : 'Esta persona';
      notifications.show({
        title: 'No permitido',
        message: `${userName} ya tiene un rol asignado o una ausencia ese día.`,
        color: 'orange'
      });
      return;
    }

    setSavingSwap(true);
    const userObj = users.find(u => String(u.id) === selectedUserId);
    try {
      await assignmentsService.swap(swapTarget.id, Number(selectedUserId));
      notifications.show({ title: 'Éxito', message: 'Servidor(a) cambiado(a)', color: 'green' });
      refetch();
      setSelectedDayEvents((prev) => prev.map(ev => ev.id === swapTarget.id
        ? {
          ...ev,
          resource: {
            ...(ev.resource || {}),
            usuario: { nombre: userObj?.nombre, apellido: userObj?.apellido }
          },
          nombre: userObj ? `${userObj.nombre} ${userObj.apellido}` : ev.nombre
        }
        : ev));
      closeSwap();
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'No se pudo cambiar el/la servidor(a)', color: 'red' });
    }
    setSavingSwap(false);
  };

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
            <Tabs.Tab value="export" leftSection={<IconList size={16} />}>
              Rol Mensual
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="calendar">
            <Box ref={calendarRef} p="md" style={{ backgroundColor: 'white' }}>
              <CustomCalendar
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                groupedAssignments={groupedAssignments}
                onDayClick={(date, assignments) => {
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
                }}
              />
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="export">
            <Group justify="space-between" mb="md">
              <Title order={3}>Rol Mensual — {departmentName}</Title>
              <Group>
                <Button variant="default" onClick={() => setCurrentDate(dayjs(currentDate).subtract(1, 'month').toDate())}>Mes Anterior</Button>
                <Button variant="default" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
                <Button variant="default" onClick={() => setCurrentDate(dayjs(currentDate).add(1, 'month').toDate())}>Siguiente Mes</Button>
                <Button onClick={handleExportMonthly}>Exportar PNG</Button>
              </Group>
            </Group>
            <Box ref={monthExportRef} p="md" className="export-month" style={{ backgroundColor: 'white' }}>
              <Group justify="space-between" mb="sm">
                <Title order={2}>
                  {departmentName}
                </Title>
                <Title order={2}>
                  {dayjs(currentDate).format('MMMM [de] YYYY')}
                </Title>
              </Group>
              <div className="export-month-grid">
                {/* Encabezados de días */}
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                  <div key={`h-${d}`} className="export-month-head">{d}</div>
                ))}
                {/* Celdas 7x6 */}
                {monthCells.cells.map((cell) => (
                  <div key={cell.key} className={`export-month-cell${cell.inMonth ? '' : ' off'}`}>
                    <div className="export-month-date">{cell.date.date()}</div>
                    <div className="export-month-items">
                      {cell.assignments.length === 0 ? (
                        <div className="export-month-empty">—</div>
                      ) : (
                        cell.assignments.map((it, idx) => (
                          <div key={idx} className="export-month-item">{it.nombre} — {it.posicion}</div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="detail">
            <Box ref={detailRef} p="md" style={{ backgroundColor: 'white' }}>
              <Stack gap="lg">
                {Object.keys(groupedAssignments).length === 0 ? (
                  <Text c="dimmed" ta="center">No hay asignaciones para este departamento</Text>
                ) : (
                  Object.entries(groupedAssignments).map(([fecha, dayData]) => (
                    <Paper key={fecha} p="md" withBorder>
                      <Group justify="space-between" mb="sm">
                        <Group gap="sm">
                          <Title order={4}>{dayjs(fecha).format('dddd, DD [de] MMMM [de] YYYY')}</Title>
                          <Badge size="lg" color="orange" variant="filled">{dayData.servicio || 'N/A'}</Badge>
                        </Group>
                        <Badge size="lg" variant="light">
                          {dayData.assignments.length} servidor{dayData.assignments.length !== 1 ? 'es(as)' : '(a)'}
                        </Badge>
                      </Group>
                      {dayData.encargado && (
                        <Paper p="sm" mb="sm" style={{ backgroundColor: '#fff9db', border: '2px solid #fab005' }}>
                          <Group gap="xs">
                            <Text size="sm" fw={700} c="yellow.9">Encargado(a):</Text>
                            <Text size="sm" fw={600} c="yellow.9">{dayData.encargado}</Text>
                          </Group>
                        </Paper>
                      )}
                      <Table highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Servidor(a)</Table.Th>
                            <Table.Th>Posición</Table.Th>
                            <Table.Th>Uniforme</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {dayData.assignments.map((asig) => (
                            <Table.Tr key={asig.id}>
                              <Table.Td fw={500}>{asig.nombre}</Table.Td>
                              <Table.Td>
                                <Badge variant="dot" color="blue">{asig.posicion}</Badge>
                              </Table.Td>
                              <Table.Td>
                                <Badge color="grape">{asig.uniforme}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))}
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
