// Refreshing and ensuring TS service pickup
import React, { useState, useEffect, useMemo } from 'react';
import { Stepper, Button, Group, Title, Modal, Badge, Paper, Text, Select, Stack, Container, Box, Progress } from '@mantine/core';
import { getUsersNotAssignedOnDate } from '../../utils/exclusionLogic';
import { useDisclosure } from '@mantine/hooks';
import { supabase } from '../../services/supabaseClient';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconInfoCircle,
  IconLock,
  IconHistory,
  IconCalendarEvent,
  IconBuilding,
  IconCalendar,
  IconChecklist
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { usePermissions } from '../../hooks/usePermissions';
import { useAutoAssign } from './hooks/useAutoAssign';
import { PlanningStepDeptMonth } from './components/PlanningStepDeptMonth';
import { PlanningStepServiceDates } from './components/PlanningStepServiceDates';
import { PlanningStepReview } from './components/PlanningStepReview';

export function PlanningWizard() {
  const permissions = usePermissions();
  const [active, setActive] = useState(0);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [active]);

  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [positions, setPositions] = useState([]);
  const [serviceConfigs, setServiceConfigs] = useState({});
  const [autoAssign, setAutoAssign] = useState(true);
  const [deptMeta, setDeptMeta] = useState({});
  const [priorityOneIds, setPriorityOneIds] = useState([]);
  const [headerState, setHeaderState] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [previewAssignments, setPreviewAssignments] = useState([]);
  const [viewModalOpened, { open: openViewModal, close: closeViewModal }] = useDisclosure(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editAssignment, setEditAssignment] = useState({});
  const [globalAssignments, setGlobalAssignments] = useState([]);

  // Custom Hooks
  const { generateAssignments, loading: assigningLoading } = useAutoAssign(selectedDept, deptMeta);
  const [loading, setLoading] = useState(false); // General loading

  useEffect(() => {
    fetchDepartments();
  }, [permissions]);

  useEffect(() => {
    if (selectedDept) {
      fetchPositions();
    }
  }, [selectedDept]);

  // Sync Service Configs with Positions
  useEffect(() => {
    if (!selectedDates.length) return;
    if (!positions.length) return;

    const newConfigs = { ...serviceConfigs };
    selectedDates.forEach(dateStr => {
      const current = newConfigs[dateStr] || { type: 'Culto General', uniform: 'Formal Gris', positionQuotas: {} };
      const pq = { ...(current.positionQuotas || {}) };
      positions.forEach(p => {
        if (pq[p.id] === undefined) {
          pq[p.id] = p.cantidad_default;
        }
      });
      newConfigs[dateStr] = { ...current, positionQuotas: pq };
    });
    setServiceConfigs(newConfigs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions]);

  useEffect(() => {
    if (selectedDept && selectedMonth) {
      fetchExistingHeader();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDept, selectedMonth]);

  const fetchPositions = async () => {
    const { data } = await supabase.from('posiciones_departamento').select('*').eq('departamento_id', selectedDept);
    setPositions(data || []);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departamentos').select('*');
    if (data) {
      const manageable = data.filter(d => permissions.canManageDepartment(d.id));
      setDepartments(manageable.map(d => ({ value: String(d.id), label: d.nombre })));
      const meta = {};
      const p1 = [];
      data.forEach(d => {
        const priority = Number(d.prioridad);
        meta[String(d.id)] = { prioridad: priority };
        if (priority === 1) p1.push(d.id);
      });
      setDeptMeta(meta);
      setPriorityOneIds(p1);
      if (manageable.length > 0) {
        setSelectedDept(String(manageable[0].id));
      }
    }
  };

  const fetchExistingHeader = async () => {
    const dateObj = dayjs(selectedMonth);
    if (!dateObj.isValid()) return;

    const { data, error } = await supabase
      .from('roles_cabecera')
      .select('*')
      .eq('departamento_id', Number(selectedDept))
      .eq('mes', dateObj.month() + 1)
      .eq('anio', dateObj.year())
      .maybeSingle();

    if (error) {
      console.error('Error fetching header:', error);
      return;
    }

    if (data) setHeaderState({ id: data.id, estado: data.estado });
    else setHeaderState(null);
  };

  const handleDateChange = (dates) => {
    // String-based Logic (Refactored)
    const uniqueStrings = new Set();
    const processDate = (d) => {
      if (!d) return;
      if (typeof d === 'string') {
        uniqueStrings.add(d);
        return;
      }
      let djs = dayjs(d);
      const str = djs.hour(12).format('YYYY-MM-DD'); // Safe format
      uniqueStrings.add(str);
    };

    if (Array.isArray(dates)) {
      dates.forEach(processDate);
    } else if (dates) {
      processDate(dates);
    }

    const sortedDates = Array.from(uniqueStrings).sort();
    setSelectedDates(sortedDates);

    // Sync configs instantly
    const newConfigs = { ...serviceConfigs };
    sortedDates.forEach(dateStr => {
      if (!newConfigs[dateStr]) {
        const posQuotas = {};
        positions.forEach(p => posQuotas[p.id] = p.cantidad_default > 0 ? p.cantidad_default : 1);
        newConfigs[dateStr] = {
          type: 'Culto General',
          uniform: 'Formal Gris',
          positionQuotas: posQuotas
        };
      }
    });
    setServiceConfigs(newConfigs);
  };

  const updateServiceConfig = (dateStr, field, value) => {
    setServiceConfigs(prev => ({
      ...prev,
      [dateStr]: { ...prev[dateStr], [field]: value }
    }));
  };

  const updatePositionQuota = (dateStr, posId, value) => {
    setServiceConfigs(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        positionQuotas: {
          ...prev[dateStr].positionQuotas,
          [posId]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedDept || !permissions.canCreateSchedule(selectedDept)) {
      notifications.show({
        title: 'Acceso Denegado',
        message: 'No tienes los permisos necesarios para planificar este departamento.',
        color: 'red',
        icon: <IconLock size={18} />
      });
      return;
    }
    setLoading(true);
    try {
      const selectedDeptMeta = deptMeta[selectedDept];
      const currentMonth = dayjs(selectedMonth).month() + 1;
      const currentYear = dayjs(selectedMonth).year();

      // Check for conflicts before approving
      const conflictItems = Object.keys(conflicts);
      if (conflictItems.length > 0) {
        notifications.show({
          title: 'Conflictos Detectados',
          message: 'No se puede aprobar el rol mientras existan servidores(as) asignados(as) a otros departamentos para la misma fecha. Por favor, edita o elimina esas asignaciones.',
          color: 'red',
          autoClose: 10000
        });
        setLoading(false);
        return;
      }

      if (selectedDeptMeta?.prioridad !== 1) {
        if (priorityOneIds.length > 0) {
          const { data: p1Roles, error: p1Error } = await supabase
            .from('roles_cabecera')
            .select('id, estado, departamento_id')
            .in('departamento_id', priorityOneIds)
            .eq('mes', currentMonth)
            .eq('anio', currentYear)
            .in('estado', ['Aprobado', 'Publicado']);

          if (p1Error) {
            console.error('Error checking priority dependency:', p1Error);
            notifications.show({
              title: 'Error de Verificación',
              message: 'Hubo un problema al consultar el estado del Servicio General.',
              color: 'red',
              icon: <IconX size={18} />
            });
            setLoading(false);
            return;
          }

          if (!p1Roles || p1Roles.length === 0) {
            notifications.show({
              title: 'Dependencia Requerida',
              message: 'El Servicio General (Prioridad 1) debe estar APROBADO antes de poder planificar este departamento.',
              color: 'orange',
              icon: <IconAlertTriangle size={18} />,
              autoClose: 10000
            });
            setLoading(false);
            return;
          }
        }
      }

      // 1. Create or Update Header
      let headerId = headerState?.id;
      if (!headerId) {
        const { data: header, error: headerError } = await supabase
          .from('roles_cabecera')
          .insert({
            departamento_id: Number(selectedDept),
            mes: currentMonth,
            anio: currentYear,
            estado: 'Aprobado' // Cambiamos a Aprobado ya que el botón dice "Aprobar y Guardar"
          })
          .select()
          .single();

        if (headerError) {
          console.error('RLS/DB Error on roles_cabecera INSERT:', headerError);
          throw headerError;
        }
        headerId = header.id;
        setHeaderState({ id: header.id, estado: header.estado });
      } else {
        // Si ya existe, actualizamos el estado a Aprobado y limpiamos configuraciones previas
        const { error: updateError } = await supabase
          .from('roles_cabecera')
          .update({ estado: 'Aprobado' })
          .eq('id', headerId);

        if (updateError) throw updateError;

        const { error: delError } = await supabase
          .from('configuracion_dia')
          .delete()
          .eq('rol_cabecera_id', headerId);
        if (delError) throw delError;
      }

      // 2. Create Daily Configs
      const configsPayload = selectedDates.map(dateStr => {
        const conf = serviceConfigs[dateStr];
        return {
          rol_cabecera_id: headerId,
          fecha: dateStr,
          tipo_servicio: conf?.type,
          color_uniforme: conf?.uniform,
          cupo_hombres: 0,
          cupo_mujeres: 0
        };
      });

      const { data: savedConfigs, error: configError } = await supabase
        .from('configuracion_dia')
        .insert(configsPayload)
        .select();

      if (configError) throw configError;

      // 3. Save Assignments
      if (previewAssignments.length > 0 && savedConfigs) {
        const finalAssignments = previewAssignments.map(prev => {
          const realConfig = savedConfigs.find(c => c.fecha === prev.fecha);
          if (!realConfig) return null;

          return {
            configuracion_dia_id: realConfig.id,
            usuario_id: prev.usuario_id,
            posicion_id: prev.posicion_id
          };
        }).filter(Boolean);

        if (finalAssignments.length > 0) {
          const { error } = await supabase.from('asignaciones').insert(finalAssignments);
          if (error) {
            console.error('❌ [SAVE] Error insertando asignaciones:', error);
            throw error;
          }
        }
      }

      notifications.show({
        title: '¡Éxito!',
        message: `El rol de ${departments.find(d => d.value === selectedDept)?.label} ha sido guardado y aprobado.`,
        color: 'green',
        icon: <IconCheck size={18} />
      });
      setActive(0);
      setSelectedDates([]);
      setSelectedDept(null);
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: error.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (active === 0) {
      if (!selectedDept || !selectedMonth) {
        notifications.show({
          title: 'Selección Faltante',
          message: 'Por favor, elige un departamento y el mes de trabajo.',
          color: 'yellow',
          icon: <IconInfoCircle size={18} />
        });
        return;
      }
    }

    if (active === 1) {
      if (!selectedDates.length) {
        notifications.show({
          title: 'Sin Fechas',
          message: 'Debes seleccionar al menos un día de servicio en el calendario.',
          color: 'yellow',
          icon: <IconCalendarEvent size={18} />
        });
        return;
      }

      // Priority Validation before generating draft
      const selectedDeptMeta = deptMeta[selectedDept];
      const currentMonth = dayjs(selectedMonth).month() + 1;
      const currentYear = dayjs(selectedMonth).year();

      if (selectedDeptMeta?.prioridad !== 1 && priorityOneIds.length > 0) {
        setLoading(true);
        const { data: p1Roles, error: p1Error } = await supabase
          .from('roles_cabecera')
          .select('id, estado')
          .in('departamento_id', priorityOneIds)
          .eq('mes', currentMonth)
          .eq('anio', currentYear)
          .in('estado', ['Aprobado', 'Publicado']);

        setLoading(false);

        if (p1Error) {
          console.error('Error checking priority dependency:', p1Error);
          notifications.show({
            title: 'Error de Verificación',
            message: 'Hubo un problema al consultar el estado del Servicio General.',
            color: 'red'
          });
          return;
        }

        if (!p1Roles || p1Roles.length === 0) {
          notifications.show({
            title: 'Generación Bloqueada',
            message: 'El Servicio General (Prioridad 1) debe tener un rol APROBADO para este mes antes de que puedas generar el borrador de este departamento.',
            color: 'orange',
            icon: <IconAlertTriangle size={18} />,
            autoClose: 10000
          });
          return;
        }
      }

      for (const dateStr of selectedDates) {
        const conf = serviceConfigs[dateStr];
        if (!conf?.type || !conf?.uniform) {
          notifications.show({ title: 'Datos incompletos', message: 'Define tipo y uniforme para todas las fechas.', color: 'yellow' });
          return;
        }
        const hasQuota = Object.values(conf.positionQuotas || {}).some(v => (v ?? 0) > 0);
        if (!hasQuota) {
          notifications.show({
            title: 'Configuración de Cupos',
            message: 'Asegúrate de asignar al menos un voluntario en las posiciones para cada fecha.',
            color: 'yellow',
            icon: <IconAlertTriangle size={18} />
          });
          return;
        }
      }

      // Generate Preview
      const mockSavedConfigs = selectedDates.map(dateStr => ({
        id: `temp-${dateStr}`,
        fecha: dateStr
      }));

      try {
        setLoading(true);
        await fetchPositions(); // Ensure positions are loaded for the current dept
        const result = await generateAssignments(mockSavedConfigs, serviceConfigs, positions);
        const { assignments: generated } = result;

        // Fetch global assignments to check for conflicts
        const currentMonth = dayjs(selectedMonth).month() + 1;
        const currentYear = dayjs(selectedMonth).year();
        const { assignmentsService } = await import('../../services/assignmentsService');
        const globals = await assignmentsService.fetchAllByMonth(currentMonth, currentYear);
        setGlobalAssignments(globals);

        if (!generated || generated.length === 0) {
          notifications.show({
            title: 'Sin Asignaciones',
            message: 'No fue posible generar el rol automáticamente. Verifica que existan servidores(as) disponibles.',
            color: 'orange',
            icon: <IconAlertTriangle size={18} />,
            autoClose: 8000
          });
        }

        const enriched = generated.map(a => {
          const pos = positions.find(p => String(p.id) === String(a.posicion_id));
          const config = mockSavedConfigs.find(c => c.id === a.configuracion_dia_id);

          return {
            ...a,
            id: `temp-assign-${Math.random()}`,
            posicion: pos,
            fecha: config ? config.fecha : dayjs().format('YYYY-MM-DD')
          };
        });

        setPreviewAssignments(enriched);
        notifications.show({
          title: 'Rol Proyectado',
          message: 'Se han generado las asignaciones sugeridas. Puedes editarlas en la tabla.',
          color: 'blue',
          icon: <IconHistory size={18} />
        });
      } catch (e) {
        console.error(e);
        notifications.show({ title: 'Error', message: e.message || 'Error generando borrador', color: 'red' });
        return;
      } finally {
        setLoading(false);
      }
    }

    if (active < 2) setActive(active + 1);
  };

  const [replacements, setReplacements] = useState([]);

  const handleEdit = async (assignment) => {
    setEditAssignment(assignment);
    const idx = previewAssignments.findIndex(a => a.id === assignment.id);
    setEditIndex(idx !== -1 ? idx : null);
    setEditModalOpened(true);

    const date = assignment.fecha;
    if (date) {
      console.log('🔍 Iniciando swap para fecha:', date, 'Posición:', assignment.posicion?.nombre);

      const { data: deptMemberships, error: memError } = await supabase
        .from('membresias')
        .select(`
          rol_jerarquico,
          usuario:usuarios(id, nombre, apellido, genero)
        `)
        .eq('departamento_id', Number(selectedDept));

      if (memError) console.error('❌ Error fetching memberships:', memError);

      if (deptMemberships) {
        const normalize = (str) => str?.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';

        // Group by user
        const usersWithRolesMap = {};
        deptMemberships.forEach(m => {
          if (!m.usuario) return;
          const uid = String(m.usuario.id);
          if (!usersWithRolesMap[uid]) {
            usersWithRolesMap[uid] = {
              ...m.usuario,
              roles: []
            };
          }
          usersWithRolesMap[uid].roles.push(normalize(m.rol_jerarquico));
        });

        const allDeptUsers = Object.values(usersWithRolesMap);

        // 1. Get global conflicts for this date
        const { data: blockedResults } = await supabase.rpc('get_blocked_users', {
          p_date: date
        });
        const blockedMap = {};
        blockedResults?.forEach(row => {
          if (row.usuario_id) blockedMap[String(row.usuario_id)] = row.motivo || 'Ocupado';
        });

        // 2. Get draft conflicts (already in this month's draft for this date)
        const draftConflictIds = previewAssignments
          .filter(a => a.fecha === date && String(a.id) !== String(assignment.id))
          .map(a => String(a.usuario_id));

        const pos = assignment.posicion;
        const posNameNorm = normalize(pos?.nombre);
        const isEncargadoPos = posNameNorm.includes('encargad');

        const finalCandidates = allDeptUsers.map(u => {
          const uid = String(u.id);
          const globalConflict = blockedMap[uid];
          const draftConflict = draftConflictIds.includes(uid);

          // Gender check
          const genderMatch = !pos?.genero_requerido ||
            pos.genero_requerido === 'A' ||
            u.genero === pos.genero_requerido;

          // Role check for Encargado
          let roleMatch = true;
          if (isEncargadoPos) {
            roleMatch = u.roles.some(r =>
              r.includes('lider') ||
              r.includes('encargad') ||
              r.includes('sublider')
            );
          }

          let status = 'Disponible';
          let color = 'green';
          let disabled = !genderMatch || !roleMatch;

          if (globalConflict) {
            status = `⚠️ ${globalConflict}`;
            color = 'orange';
          } else if (draftConflict) {
            status = '⚠️ Ya en borrador';
            color = 'orange';
          } else if (!genderMatch) {
            status = '❌ Género no apto';
            color = 'red';
          } else if (!roleMatch) {
            status = '❌ Falta rango';
            color = 'red';
          }

          return {
            ...u,
            status,
            statusColor: color,
            disabled,
            label: `${u.nombre} ${u.apellido} (${status})`
          };
        }).sort((a, b) => {
          // Sort: Available first, then conflicts, then disabled
          if (a.disabled !== b.disabled) return a.disabled ? 1 : -1;
          if (a.status === 'Disponible' && b.status !== 'Disponible') return -1;
          if (a.status !== 'Disponible' && b.status === 'Disponible') return 1;
          return a.nombre.localeCompare(b.nombre);
        });

        setReplacements(finalCandidates);
      }
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar?')) {
      setPreviewAssignments(prev => prev.filter(a => a.id !== id));
    }
  };

  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  // Detect conflicts in current preview
  const conflicts = useMemo(() => {
    const conflictMap = {};
    previewAssignments.forEach(pa => {
      const dateStr = pa.fecha;
      const globalMatches = globalAssignments.filter(ga =>
        String(ga.usuario_id) === String(pa.usuario_id) &&
        ga.configuracion_dia?.fecha === dateStr
      );
      if (globalMatches.length > 0) {
        conflictMap[pa.id] = globalMatches.map(m => m.configuracion_dia.roles_cabecera.departamento.nombre);
      }
    });
    return conflictMap;
  }, [previewAssignments, globalAssignments]);

  return (
    <Container size="xl" py="xl">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Title order={2}>Planificador de Roles</Title>
            <Text c="dimmed" size="sm">Configura, asigna y aprueba el rol mensual de tu departamento</Text>
          </div>
          <Badge size="lg" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            BETA
          </Badge>
        </Group>

        {/* Progress indicator */}
        <Progress
          value={(active / 2) * 100}
          size="sm"
          radius="xl"
          mb="lg"
          color="blue"
          striped
          animated={loading || assigningLoading}
        />

        <Stepper
          active={active}
          onStepClick={setActive}
          breakpoint="sm"
          mb="xl"
          size="md"
          iconSize={42}
        >
          <Stepper.Step
            icon={<IconBuilding size={20} />}
            label="Departamento"
            description="Selección de equipo"
            allowStepSelect={active > 0}
          />
          <Stepper.Step
            icon={<IconCalendar size={20} />}
            label="Configuración"
            description="Fechas y servicios"
            allowStepSelect={active > 1}
          />
          <Stepper.Step
            icon={<IconChecklist size={20} />}
            label="Revisión"
            description="Gestión de borrador"
            allowStepSelect={active > 2}
          />
        </Stepper>

        <div style={{ minHeight: 400 }}>
          {active === 0 && (
            <PlanningStepDeptMonth
              departments={departments}
              selectedDept={selectedDept}
              setSelectedDept={setSelectedDept}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          )}
          {active === 1 && (
            <PlanningStepServiceDates
              selectedDates={selectedDates}
              handleDateChange={handleDateChange}
              serviceConfigs={serviceConfigs}
              updateServiceConfig={updateServiceConfig}
              positions={positions}
              updatePositionQuota={updatePositionQuota}
              selectedMonth={selectedMonth}
            />
          )}
          {active === 2 && (
            <PlanningStepReview
              assignments={previewAssignments}
              serviceConfigs={serviceConfigs}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              conflicts={conflicts}
            />
          )}
        </div>

        <Group justify="flex-end" mt="xl" style={{ borderTop: '1px solid #eee', paddingTop: 20 }}>
          {active > 0 && (
            <Button variant="default" onClick={prevStep} size="md">
              Volver
            </Button>
          )}
          {active < 2 ? (
            <Button onClick={handleNext} size="md" loading={loading || assigningLoading}>
              {active === 1 ? 'Generar Borrador' : 'Siguiente'}
            </Button>
          ) : (
            <Button onClick={handleSave} size="md" color="green" loading={loading || assigningLoading}>
              Aprobar y Guardar Rol
            </Button>
          )}
        </Group>
      </Paper>

      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="Cambiar Servidor(a)"
        size="md"
      >
        <Stack>
          <Text size="sm">
            Fecha: {dayjs(editAssignment.fecha).format('dddd D [de] MMMM')}
          </Text>
          <Text size="sm">
            Posición: {editAssignment.posicion?.nombre}
          </Text>

          <Select
            label="Seleccionar Nuevo(a) Servidor(a)"
            placeholder="Busca un voluntario disponible"
            data={(replacements || []).map(u => ({
              value: String(u.id),
              label: u.label,
              disabled: u.disabled
            }))}
            searchable
            nothingFoundMessage="No hay voluntarios disponibles"
            value={editAssignment.usuario_id ? String(editAssignment.usuario_id) : null}
            onChange={(value) => {
              const selectedUser = replacements.find(r => String(r.id) === value);
              if (selectedUser) {
                const newName = { nombre: selectedUser.nombre, apellido: selectedUser.apellido };
                setEditAssignment(prev => ({ ...prev, usuario_id: value, usuario: newName }));
              }
            }}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setEditModalOpened(false)}>Cancelar</Button>
            <Button onClick={() => {
              setPreviewAssignments(prev => {
                const next = [...prev];
                if (editIndex !== null && editIndex >= 0) {
                  next[editIndex] = editAssignment;
                }
                return next;
              });
              setEditModalOpened(false);
              notifications.show({ title: 'Actualizado', message: 'Asignación modificada', color: 'green' });
            }}>Confirmar Cambio</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
