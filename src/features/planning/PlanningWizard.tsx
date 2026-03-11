// Refreshing and ensuring TS service pickup
import { useEffect } from 'react';
import { Stepper, Button, Group, Title, Paper, Text, Stack, Container, Progress, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import {
  IconBuilding,
  IconCalendar,
  IconChecklist,
  IconInfoCircle,
  IconLock,
  IconRobot,
  IconAlertCircle
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

export function PlanningWizard() {
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
    serviceConfigs,
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
  const handleNext = async () => {
    if (activeStep === 0) {
      if (!selectedDeptId || !selectedMonth) {
        notifications.show({
          title: 'Selección Faltante',
          message: 'Por favor, elige un departamento y el mes de trabajo.',
          color: 'yellow',
          icon: <IconInfoCircle size={18} />
        });
        return;
      }

      // Permission check
      if (!permissions.canCreateSchedule(selectedDeptId)) {
        notifications.show({
          title: 'Acceso Denegado',
          message: 'No tienes permiso para planificar este departamento.',
          color: 'red',
          icon: <IconLock size={18} />
        });
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
            notifications.show({
              title: 'Prioridad Requerida',
              message: 'Debes generar primero el rol del departamento de Servidores para este mes.',
              color: 'orange',
              icon: <IconAlertCircle size={18} />
            });
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
        notifications.show({
          title: 'Sin Fechas',
          message: 'Debes seleccionar al menos un día de servicio.',
          color: 'yellow'
        });
        return;
      }

      // VALIDATION: Check for incomplete service configs
      for (const dateStr of selectedDates) {
        const configs = serviceConfigs[dateStr] || [];
        for (let i = 0; i < configs.length; i++) {
          const config = configs[i];
          const hasQuotas = Object.values(config.positionQuotas).some(v => v > 0);
          
          if (!config.type || !config.uniform || !hasQuotas) {
            notifications.show({
              title: 'Configuración Incompleta',
              message: `El servicio ${i + 1} del día ${dayjs(dateStr).format('DD/MM')} está incompleto (falta tipo, uniforme o voluntarios).`,
              color: 'red',
              icon: <IconAlertCircle size={18} />
            });
            return;
          }
        }
      }

      // Automatically Generate Draft
      setLoading(true);
      try {
        const savedConfigsStub: any[] = [];
        selectedDates.forEach(dateStr => {
          const dayConfigs = serviceConfigs[dateStr] || [];
          dayConfigs.forEach((_, idx) => {
            savedConfigsStub.push({
              id: `temp-${dateStr}-${idx}`,
              fecha: dateStr,
              serviceIndex: idx
            });
          });
        });

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

        setPreviewAssignments(mapped);

        notifications.show({
          title: 'Generación Exitosa',
          message: `Se asignaron ${mapped.length} puestos automáticamente using IA.`,
          color: 'teal',
          icon: <IconRobot size={18} />
        });

        setActiveStep(activeStep + 1);

      } catch (error) {
        console.error(error);
        notifications.show({
          title: 'Error',
          message: 'Falló la generación automática.',
          color: 'red'
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (activeStep === 2) {
      await handleFinish();
      return;
    }

    if (activeStep < 2) setActiveStep(activeStep + 1);
  };

  const handleFinish = async () => {
    if (!selectedDeptId || !selectedMonth || previewAssignments.length === 0) return;

    setLoading(true);
    try {
      const monthNum = dayjs(selectedMonth).month() + 1;
      const yearNum = dayjs(selectedMonth).year();

      // 1. Get or Create Header
      let headerId = headerState?.id;
      if (!headerId) {
        const { data: newHeader, error: hError } = await supabase
          .from('roles_cabecera')
          .insert({
            departamento_id: Number(selectedDeptId),
            mes: monthNum,
            anio: yearNum,
            estado: 'Borrador'
          })
          .select()
          .single();

        if (hError) throw hError;
        headerId = newHeader.id;
      }

      // 2. Clear existing assignments/configs for this header (Reset approach)
      const { data: existingConfigs } = await supabase
        .from('configuracion_dia')
        .select('id')
        .eq('rol_cabecera_id', headerId);

      const configIds = existingConfigs?.map(c => c.id) || [];
      if (configIds.length > 0) {
        await supabase.from('asignaciones').delete().in('configuracion_dia_id', configIds);
        await supabase.from('configuracion_dia').delete().eq('rol_cabecera_id', headerId);
      }

      // 3. Save configuracion_dia in bulk
      const configsToInsert = [];
      const configKeys: string[] = [];

      for (const dateStr of selectedDates) {
        const dayConfigs = serviceConfigs[dateStr] || [];
        for (let idx = 0; idx < dayConfigs.length; idx++) {
          const config = dayConfigs[idx];
          
          // Calculate gender quotas based on positions
          let cupoH = 0;
          let cupoM = 0;
          Object.entries(config.positionQuotas).forEach(([posId, count]) => {
            const pos = positions.find(p => String(p.id) === posId);
            if (pos?.genero_requerido === 'M') cupoH += Number(count);
            else if (pos?.genero_requerido === 'F') cupoM += Number(count);
          });

          // Extract encargados from previewAssignments for this service
          const serviceAssignments = previewAssignments.filter(a => a.configuracion_dia_id === `temp-${dateStr}-${idx}`);
          const encargados = serviceAssignments
            .filter(a => a.posicion?.nombre?.toLowerCase().includes('encargado'))
            .map(a => Number(a.usuario_id));

          configsToInsert.push({
            rol_cabecera_id: headerId,
            fecha: dateStr,
            tipo_servicio: config.type,
            color_uniforme: config.uniform,
            encargado_id: encargados[0] || null,
            encargado_2_id: encargados[1] || null,
            cupo_hombres: cupoH,
            cupo_mujeres: cupoM
          });
          configKeys.push(`temp-${dateStr}-${idx}`);
        }
      }

      const { data: savedConfigs, error: cError } = await supabase
        .from('configuracion_dia')
        .insert(configsToInsert)
        .select();

      if (cError) throw cError;
      if (!savedConfigs) throw new Error('Error al guardar configuraciones de día');

      const tempToRealConfigId: Record<string, number> = {};
      savedConfigs.forEach((sc, idx) => {
        // Postgres returns rows in insertion order for bulk inserts
        tempToRealConfigId[configKeys[idx]] = sc.id;
      });

      // 4. Save asignaciones
      const assignmentsChunks = [];
      const batchSize = 500;
      const rawAssignments = previewAssignments.map(a => ({
        configuracion_dia_id: tempToRealConfigId[a.configuracion_dia_id as string],
        usuario_id: Number(a.usuario_id),
        posicion_id: Number(a.posicion_id)
      }));

      for (let i = 0; i < rawAssignments.length; i += batchSize) {
        assignmentsChunks.push(rawAssignments.slice(i, i + batchSize));
      }

      for (const chunk of assignmentsChunks) {
        const { error: aError } = await supabase.from('asignaciones').insert(chunk);
        if (aError) throw aError;
      }

      notifications.show({
        title: '¡Éxito!',
        message: 'El rol ha sido guardado correctamente.',
        color: 'green',
        icon: <IconChecklist size={18} />
      });

      navigate('/');

    } catch (error: any) {
      console.error('Error saving role:', error);
      notifications.show({
        title: 'Error al Guardar',
        message: error.message || 'No se pudo guardar el rol.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  return (
    <Container size="xl" py="xl">
      <Paper shadow="sm" p="xl" radius="lg" withBorder className="animate-fade-in" style={{ backgroundColor: 'var(--mantine-color-body)', borderColor: 'var(--mantine-color-default-border)' }}>
        <Group justify="space-between" mb="md">
          <Stack gap={0}>
            <Title order={2} style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--mantine-color-text)', letterSpacing: '-0.02em' }}>Planificador de Roles</Title>
            <Text c="dimmed" size="sm" fw={500}>Configura, asigna y aprueba el rol mensual de tu departamento</Text>
          </Stack>
          <Badge size="lg" variant="light" color="gold" radius="md">
            VERSIÓN 2.5
          </Badge>
        </Group>

        <Progress
          value={(activeStep / 2) * 100}
          size="sm"
          radius="xl"
          mb="lg"
          color="gold"
          striped
          animated={loading}
        />

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

        <div style={{ minHeight: 400 }}>
          {activeStep === 0 && (
            <PlanningStepDeptMonth
              departments={(deptData?.options || []).filter(opt => permissions.canManageDepartment(Number(opt.value)))}
              selectedDept={selectedDeptId}
              setSelectedDept={setSelectedDeptId}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          )}
          {activeStep === 1 && (
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
          )}
          {activeStep === 2 && (
            <PlanningStepReview />
          )}
        </div>

        <Group justify="center" mt="xl">
          <Button variant="default" onClick={prevStep} disabled={activeStep === 0}>
            Atrás
          </Button>
          <Button onClick={handleNext} color="gold" c="white">
            {activeStep === 2 ? 'Finalizar' : 'Siguiente'}
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}
