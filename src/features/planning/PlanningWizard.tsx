// Refreshing and ensuring TS service pickup
import { useEffect } from 'react';
import { Stepper, Button, Group, Title, Paper, Text, Stack, Container, Progress, Badge, Transition, Divider, LoadingOverlay } from '@mantine/core';
import { notify } from '../../utils/notificationsHelper';
import { useNavigate } from 'react-router-dom';
import {
  IconBuilding,
  IconCalendar,
  IconChecklist
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { supabase } from '../../services/supabaseClient';

// Hooks & Context
import { usePlanning, PlanningProvider } from './context/PlanningContext';
import { useDepartments } from '../../hooks/queries/useDepartments';
import { usePositions } from '../../hooks/queries/usePositions';
import { useRoleHeader } from '../../hooks/queries/useRolesCabecera';
import { usePermissions } from '../../hooks/usePermissions';
import { useAutoAssign } from './hooks/useAutoAssign';

// Components
import { PlanningStepDeptMonth } from './components/PlanningStepDeptMonth';
import { PlanningStepServiceDates } from './components/PlanningStepServiceDates';
import { PlanningStepReview } from './components/PlanningStepReview';

function getServiceKey(dateStr: string, serviceIndex: number) {
  return `temp-${dateStr}-${serviceIndex}`;
}

export default function PlanningWizard() {
  return (
    <PlanningProvider>
      <PlanningWizardContent />
    </PlanningProvider>
  );
}

function PlanningWizardContent() {
  const permissions = usePermissions();
  const {
    activeStep,
    setActiveStep,
    selectedDeptId, setSelectedDeptId,
    selectedMonth, setSelectedMonth,
    selectedDates,
    handleDateChange,
    setPositions,
    headerState, setHeaderState,
    serviceConfigs, setServiceConfigs,
    previewAssignments, setPreviewAssignments,
    loading, setLoading,
    positions,
    addServiceToDate,
    removeServiceFromDate,
    updateServiceConfig,
    updatePositionQuota
  } = usePlanning();

  const navigate = useNavigate();

  // --- Data Fetching (React Query) ---
  const { data: deptData } = useDepartments();
  const { data: positionsData } = usePositions(selectedDeptId);

  // Custom Hook for Generation
  const { generateAssignments } = useAutoAssign(selectedDeptId);

  // Sync positions to context when they load
  useEffect(() => {
    if (positionsData) setPositions(positionsData);
  }, [positionsData, setPositions]);

  // Check header state
  const { data: headerData } = useRoleHeader({
    departmentId: selectedDeptId,
    month: selectedMonth ? dayjs(selectedMonth).month() + 1 : null,
    year: selectedMonth ? dayjs(selectedMonth).year() : null
  });

  useEffect(() => {
    if (headerData) {
      setHeaderState({
        id: headerData.id,
        estado: headerData.estado ?? null
      });
    } else {
      setHeaderState(null);
    }
  }, [headerData, setHeaderState]);

  // Scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStep]);

  // --- Navigation Logic ---
  const loadExistingRole = async () => {
    if (!headerState?.id) return;
    setLoading(true);
    try {
      const { data: configs, error: configError } = await supabase
        .from('configuracion_dia')
        .select(`
          *,
          asignaciones (*, usuario:usuarios(nombre, apellido)),
          asistencias (id)
        `)
        .eq('rol_cabecera_id', headerState.id)
        .order('fecha', { ascending: true });

      if (configError) throw configError;

      if (!configs || configs.length === 0) {
        notify.warning('El rol existe pero no tiene días configurados.', 'Aviso');
        setActiveStep(1); 
        return;
      }

      const newSelectedDates = new Set<string>();
      const newServiceConfigs: Record<string, any[]> = {};
      const newPreviewAssignments: any[] = [];

      configs.forEach((config: any) => {
        newSelectedDates.add(config.fecha);
        
        if (!newServiceConfigs[config.fecha]) {
          newServiceConfigs[config.fecha] = [];
        }

        // Usamos el service_index de la BD para colocarlo en la posición correcta
        const sIdx = config.service_index || 0;
        const pseudoTargetId = `temp-${config.fecha}-${sIdx}`;
        
        const posQuotas: Record<string, number> = {};
        positions.forEach(p => posQuotas[p.id] = (Number(p.cantidad_default) || 1));
        
        newServiceConfigs[config.fecha][sIdx] = {
          type: config.tipo_servicio || 'Culto General',
          uniform: config.color_uniforme || '',
          hora: config.hora_llegada ? config.hora_llegada.slice(0, 5) : '',
          encargado_id: config.encargado_id,
          encargado_2_id: config.encargado_2_id,
          positionQuotas: posQuotas,
          existingConfigId: config.id,
          hasAttendance: Array.isArray(config.asistencias) && config.asistencias.length > 0
        };

        if (config.asignaciones) {
          config.asignaciones.forEach((a: any) => {
             newPreviewAssignments.push({
               id: `draft-${Date.now()}-${Math.random()}`,
               usuario_id: a.usuario_id,
               posicion_id: a.posicion_id,
               fecha: config.fecha,
               configuracion_dia_id: pseudoTargetId,
               posicion: positions.find(p => String(p.id) === String(a.posicion_id)),
               usuario: a.usuario,
               override_restriccion: a.override_restriccion ?? false
             });
          });
        }
      });

      // Rellenar huecos si por alguna razón el service_index no es consecutivo
      Object.keys(newServiceConfigs).forEach(date => {
        const arr = newServiceConfigs[date];
        for (let i = 0; i < arr.length; i++) {
          if (!arr[i]) arr[i] = { type: 'Culto General', uniform: '', positionQuotas: {} };
        }
      });

      handleDateChange(Array.from(newSelectedDates).sort());
      setServiceConfigs(newServiceConfigs as any);
      setPreviewAssignments(newPreviewAssignments as any);
      setActiveStep(2);

      notify.success('Se cargaron exitosamente los datos guardados anteriormente.', 'Rol Cargado');
    } catch (err: any) {
      console.error('Error loading role:', err);
      notify.error('No se pudo cargar el rol existente.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!selectedDeptId || !selectedMonth) {
        notify.warning('Por favor, elige un departamento y el mes de trabajo.', 'Selección Faltante');
        return;
      }

      // Permission check
      if (!permissions.canCreateSchedule(selectedDeptId)) {
        notify.error('No tienes permiso para planificar este departamento.', 'Acceso Denegado');
        return;
      }

      // Servidores Priority Check (ID 2)
      if (selectedDeptId !== '2') {
        setLoading(true);
        const monthNum = dayjs(selectedMonth).month() + 1;
        const yearNum = dayjs(selectedMonth).year();

        try {
          const { data: servHeader } = await supabase
            .from('roles_cabecera')
            .select('id')
            .eq('departamento_id', 2)
            .eq('mes', monthNum)
            .eq('anio', yearNum)
            .maybeSingle();

          if (!servHeader) {
            notify.warning('Debes generar primero el rol del departamento de Servidores para este mes.', 'Prioridad Requerida');
            return;
          }
        } catch (error) {
          console.error('Error checking priority:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    if (activeStep === 1) {
      if (!selectedDates.length) {
        notify.warning('Debes seleccionar al menos un día de servicio.', 'Sin Fechas');
        return;
      }

      // VALIDATION: Check for incomplete service configs
      for (const dateStr of selectedDates) {
        const configs = serviceConfigs[dateStr] || [];
        for (let i = 0; i < configs.length; i++) {
          const config = configs[i];
          const hasQuotas = Object.values(config.positionQuotas).some(v => v > 0);
          
          if (!config.type || !config.uniform || !hasQuotas) {
            notify.error(
              `El servicio ${i + 1} del día ${dayjs(dateStr).format('DD/MM')} está incompleto (falta tipo, uniforme o voluntarios).`,
              'Configuración Incompleta'
            );
            return;
          }
        }
      }

      // Automatically Generate Draft
      setLoading(true);
      try {
        const savedConfigsStub: any[] = [];
        const preservedAssignments: typeof previewAssignments = [];

        selectedDates.forEach(dateStr => {
          const dayConfigs = serviceConfigs[dateStr] || [];
          dayConfigs.forEach((_, idx) => {
            const serviceKey = getServiceKey(dateStr, idx);
            const hasAttendance = !!dayConfigs[idx]?.hasAttendance;

            if (hasAttendance) {
              preservedAssignments.push(...previewAssignments.filter(a => a.configuracion_dia_id === serviceKey));
              return;
            }

            savedConfigsStub.push({
              id: serviceKey,
              fecha: dateStr,
              serviceIndex: idx
            });
          });
        });

        if (savedConfigsStub.length === 0) {
          setPreviewAssignments(preservedAssignments);
          notify.warning('Los servicios seleccionados ya tienen asistencia registrada, por lo que se conservaron sus asignaciones actuales.', 'Servicios Protegidos');
          setActiveStep(activeStep + 1);
          return;
        }

        const result = await generateAssignments(savedConfigsStub, serviceConfigs, positions);

        const mapped = result.assignments.map((a: any, idx: number) => {
          return {
            id: `draft-${idx}-${Date.now()}`,
            usuario_id: a.usuario_id,
            posicion_id: a.posicion_id,
            fecha: a.configuracion_dia_id.split('-').slice(1, 4).join('-'),
            configuracion_dia_id: a.configuracion_dia_id,
            posicion: positions.find(p => p.id === a.posicion_id),
            usuario: a.usuario
          };
        });

        setPreviewAssignments([...preservedAssignments, ...mapped]);

        notify.success(`Se asignaron ${mapped.length} puestos automáticamente using IA.`, 'Generación Exitosa');

        setActiveStep(activeStep + 1);

      } catch (error) {
        console.error(error);
        notify.error('Falló la generación automática.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (activeStep < 2) setActiveStep(activeStep + 1);
  };

  const handleFinish = async (isDefinitive: boolean = false) => {
    if (!selectedDeptId || !selectedMonth || previewAssignments.length === 0) return;

    setLoading(true);
    try {
      const monthNum = dayjs(selectedMonth).month() + 1;
      const yearNum = dayjs(selectedMonth).year();

      // 1. Get or Create Header
      let headerId = headerState?.id;
      const estadoDeseado = isDefinitive ? 'Confirmado' : 'Borrador';

      if (!headerId) {
        const { data: newHeader, error: hError } = await supabase
          .from('roles_cabecera')
          .insert({
            departamento_id: Number(selectedDeptId),
            mes: monthNum,
            anio: yearNum,
            estado: estadoDeseado
          })
          .select()
          .single();

        if (hError) throw hError;
        headerId = newHeader.id;
      } else {
        // ACTUALIZAR el estado si ya existe
        const { error: updateError } = await supabase
          .from('roles_cabecera')
          .update({ estado: estadoDeseado })
          .eq('id', headerId);
        
        if (updateError) throw updateError;
      }

      // 2. Synchronize configuracion_dia incrementally.
      // Existing service IDs are preserved so attendance history remains attached.
      const { data: existingConfigs, error: existingConfigsError } = await supabase
        .from('configuracion_dia')
        .select(`
          id,
          fecha,
          service_index,
          asistencias (id),
          asignaciones (id)
        `)
        .eq('rol_cabecera_id', headerId);

      if (existingConfigsError) throw existingConfigsError;

      const existingByKey = new Map<string, any>();
      (existingConfigs || []).forEach((config: any) => {
        existingByKey.set(getServiceKey(config.fecha, config.service_index || 0), config);
      });

      const desiredKeys = new Set<string>();
      const tempToRealConfigId: Record<string, number> = {};
      const protectedConfigIds = new Set<number>();

      for (const dateStr of selectedDates) {
        const dayConfigs = serviceConfigs[dateStr] || [];
        for (let idx = 0; idx < dayConfigs.length; idx++) {
          const config = dayConfigs[idx];
          const serviceKey = getServiceKey(dateStr, idx);
          desiredKeys.add(serviceKey);
          
          // Calculate gender quotas based on positions
          let cupoH = 0;
          let cupoM = 0;
          Object.entries(config.positionQuotas).forEach(([posId, count]) => {
            const pos = positions.find(p => String(p.id) === posId);
            if (pos?.genero_requerido === 'M') cupoH += Number(count);
            else if (pos?.genero_requerido === 'F') cupoM += Number(count);
          });

          // Extract encargados from previewAssignments for this service
          const serviceAssignments = previewAssignments.filter(a => a.configuracion_dia_id === serviceKey);
          const encargados = serviceAssignments
            .filter(a => a.posicion?.nombre?.toLowerCase().includes('encargado'))
            .map(a => Number(a.usuario_id));

          const configPayload = {
            rol_cabecera_id: headerId,
            fecha: dateStr,
            service_index: idx,
            tipo_servicio: config.type,
            color_uniforme: config.uniform,
            hora_llegada: config.hora || null,
            encargado_id: encargados[0] || null,
            encargado_2_id: encargados[1] || null,
            cupo_hombres: cupoH,
            cupo_mujeres: cupoM
          };

          const existingConfig = existingByKey.get(serviceKey);
          if (existingConfig) {
            tempToRealConfigId[serviceKey] = existingConfig.id;
            if (Array.isArray(existingConfig.asistencias) && existingConfig.asistencias.length > 0) {
              protectedConfigIds.add(existingConfig.id);
            }

            const { error: updateConfigError } = await supabase
              .from('configuracion_dia')
              .update(configPayload)
              .eq('id', existingConfig.id);

            if (updateConfigError) throw updateConfigError;
          } else {
            const { data: savedConfig, error: insertConfigError } = await supabase
              .from('configuracion_dia')
              .insert(configPayload)
              .select('id')
              .single();

            if (insertConfigError) throw insertConfigError;
            tempToRealConfigId[serviceKey] = savedConfig.id;
          }
        }
      }

      for (const [serviceKey, existingConfig] of existingByKey.entries()) {
        if (desiredKeys.has(serviceKey)) continue;

        const attendanceCount = Array.isArray(existingConfig.asistencias) ? existingConfig.asistencias.length : 0;
        if (attendanceCount > 0) {
          throw new Error(
            `No se puede eliminar el servicio del ${dayjs(existingConfig.fecha).format('DD/MM/YYYY')} porque ya tiene asistencia registrada.`
          );
        }

        const { error: deleteAssignmentsError } = await supabase
          .from('asignaciones')
          .delete()
          .eq('configuracion_dia_id', existingConfig.id);

        if (deleteAssignmentsError) throw deleteAssignmentsError;

        const { error: deleteConfigError } = await supabase
          .from('configuracion_dia')
          .delete()
          .eq('id', existingConfig.id);

        if (deleteConfigError) throw deleteConfigError;
      }

      // 3. Save assignments only for services that do not already have attendance.
      const batchSize = 500;
      const assignmentsByConfigId = new Map<number, { configuracion_dia_id: number; usuario_id: number; posicion_id: number; override_restriccion: boolean }[]>();

      previewAssignments.forEach(a => {
        const serviceKey = String(a.configuracion_dia_id);
        const realConfigId = tempToRealConfigId[serviceKey];
        if (!realConfigId || protectedConfigIds.has(realConfigId)) return;

        const list = assignmentsByConfigId.get(realConfigId) || [];
        list.push({
          configuracion_dia_id: realConfigId,
          usuario_id: Number(a.usuario_id),
          posicion_id: Number(a.posicion_id),
          override_restriccion: a.override_restriccion ?? false
        });
        assignmentsByConfigId.set(realConfigId, list);
      });

      for (const [configId, assignments] of assignmentsByConfigId.entries()) {
        const { error: deleteAssignmentsError } = await supabase
          .from('asignaciones')
          .delete()
          .eq('configuracion_dia_id', configId);

        if (deleteAssignmentsError) throw deleteAssignmentsError;

        for (let i = 0; i < assignments.length; i += batchSize) {
          const chunk = assignments.slice(i, i + batchSize);
          const { error: insertAssignmentsError } = await supabase.from('asignaciones').insert(chunk);
          if (insertAssignmentsError) throw insertAssignmentsError;
        }
      }

      if (protectedConfigIds.size > 0) {
        notify.warning(
          `${protectedConfigIds.size} servicio(s) con asistencia registrada conservaron sus asignaciones existentes.`,
          'Asistencias protegidas'
        );
      }

      notify.success('El rol ha sido guardado correctamente.', '¡Éxito!');

      navigate('/');

    } catch (error: any) {
      console.error('Error saving role:', error);
      notify.error(error.message || 'No se pudo guardar el rol.', 'Error al Guardar');
    } finally {
      setLoading(false);
    }
  };

  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
          <Stack gap={0}>
            <Title order={1} style={{ 
              fontFamily: 'Inter, sans-serif', 
              fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
              color: 'var(--mantine-color-text)', 
              letterSpacing: '-0.02em' 
            }}>Planificador de Roles</Title>
            <Text c="dimmed" size="sm" fw={500}>Configura, asigna y aprueba el rol mensual</Text>
          </Stack>
          <Badge size="lg" variant="gradient" gradient={{ from: 'orange.6', to: 'yellow.6' }} radius="md" p="md" visibleFrom="sm">
            VERSIÓN 3.5 PREMIUM
          </Badge>
        </Group>

        <Paper shadow="md" p={{ base: 'md', sm: 'xl' }} radius="xl" withBorder className="glass-card" style={{ 
          backgroundColor: 'var(--mantine-color-body)', 
          borderColor: 'var(--mantine-color-default-border)',
          minHeight: 'auto',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <LoadingOverlay visible={loading} overlayProps={{ radius: 'xl', blur: 3 }} loaderProps={{ color: 'gold', type: 'bars' }} zIndex={1000} />
          {/* Progress Indicator */}
          <Stack gap="xs" mb="xl">
            <Group justify="space-between" mb={0}>
              <Text size="xs" fw={800} tt="uppercase" c="gold.7" style={{ letterSpacing: '0.1em' }}>
                Progreso de Configuración: {Math.round((activeStep / 2) * 100)}%
              </Text>
              <Text size="xs" fw={700} c="dimmed">Paso {activeStep + 1} de 3</Text>
            </Group>
            <Progress
              value={(activeStep / 2) * 100}
              size="sm"
              radius="xl"
              color="gold"
              striped
              animated={loading}
              style={{ boxShadow: '0 2px 4px rgba(217, 119, 6, 0.1)' }}
            />
          </Stack>

        <Stepper active={activeStep} onStepClick={setActiveStep} mb="xl" size="md" iconSize={42}>
          <Stepper.Step
            icon={<IconBuilding size={20} />}
            label="Departamento"
            description="Selección de equipo"
            allowStepSelect={activeStep > 0}
          />
          <Stepper.Step
            icon={<IconCalendar size={20} />}
            label="Configuración"
            description="Fechas y servicios"
            allowStepSelect={activeStep > 1}
          />
          <Stepper.Step
            icon={<IconChecklist size={20} />}
            label="Revisión"
            description="Revisar y Guardar"
            allowStepSelect={activeStep > 2}
          />
        </Stepper>

        <div style={{ minHeight: 400, position: 'relative' }}>
          <Transition mounted={activeStep === 0} transition="fade-up" duration={350} timingFunction="ease">
            {(styles) => (
              <div style={{ ...styles }}>
                <PlanningStepDeptMonth
                  departments={(deptData?.options || []).filter(opt => permissions.canManageDepartment(Number(opt.value)))}
                  selectedDept={selectedDeptId}
                  setSelectedDept={setSelectedDeptId}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  headerState={headerState}
                  onLoadExisting={loadExistingRole}
                />
              </div>
            )}
          </Transition>
          <Transition mounted={activeStep === 1} transition="fade-up" duration={350} timingFunction="ease">
            {(styles) => (
              <div style={{ ...styles }}>
                <PlanningStepServiceDates
                  selectedDates={selectedDates}
                  handleDateChange={handleDateChange}
                  serviceConfigs={serviceConfigs}
                  updateServiceConfig={updateServiceConfig}
                  positions={positions}
                  updatePositionQuota={updatePositionQuota}
                  selectedMonth={selectedMonth}
                  addServiceToDate={addServiceToDate}
                  removeServiceFromDate={removeServiceFromDate}
                />
              </div>
            )}
          </Transition>
          <Transition mounted={activeStep === 2} transition="fade-up" duration={350} timingFunction="ease">
            {(styles) => (
              <div style={{ ...styles }}>
                <PlanningStepReview />
              </div>
            )}
          </Transition>
        </div>

        <Divider my="xl" />

        <Group justify="center" gap="xl" mt="xl">
          <Button 
            variant="subtle" 
            color="gray" 
            size="md" 
            radius="md" 
            onClick={prevStep} 
            disabled={activeStep === 0}
            leftSection={activeStep > 0 ? '←' : null}
          >
            Volver al paso anterior
          </Button>

          {activeStep < 2 ? (
            <Button
              className="btn-premium"
              size="md"
              radius="md"
              px={40}
              onClick={handleNext}
              color="gold"
              c="white"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Generando roles...' : 'Continuar'}
            </Button>
          ) : (
            <Group gap="md">
              <Button 
                variant="outline" 
                color="gray" 
                size="md" 
                radius="md" 
                onClick={() => handleFinish(false)}
              >
                Guardar como Borrador
              </Button>
              <Button 
                className="btn-premium" 
                size="md" 
                radius="md" 
                px={40} 
                onClick={() => handleFinish(true)} 
                color="teal" 
                c="white"
              >
                Publicar Rol Definitivo
              </Button>
            </Group>
          )}
        </Group>
      </Paper>
      
      {/* Footer Info */}
      <Stack align="center" mt="md" gap={4}>
        <Text size="xs" c="dimmed" fw={600}>Estás editando la planificación del mes en curso</Text>
        <Text size="xs" c="dimmed">Todos los cambios se guardan automáticamente como borradores</Text>
      </Stack>
    </Stack>
  </Container>
  );
}
