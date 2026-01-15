// Refreshing and ensuring TS service pickup
import { useEffect } from 'react';
import { Stepper, Button, Group, Title, Paper, Text, Stack, Container, Progress, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconBuilding,
  IconCalendar,
  IconChecklist,
  IconInfoCircle,
  IconLock,
  IconRobot
} from '@tabler/icons-react';
import dayjs from 'dayjs';

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
    activeStep, setActiveStep,
    selectedDeptId, setSelectedDeptId,
    selectedMonth, setSelectedMonth,
    selectedDates,
    handleDateChange,
    setPositions,
    setHeaderState,
    serviceConfigs,
    setPreviewAssignments,
    loading, setLoading,
    positions,
    addServiceToDate,
    removeServiceFromDate,
    updateServiceConfig,
    updatePositionQuota
  } = usePlanning();

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
    if (headerData) setHeaderState({ id: headerData.id, estado: headerData.estado });
    else setHeaderState(null);
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

      // Automatically Generate Draft
      setLoading(true);
      try {
        // Flatten configs for generation
        // Structure needed: { id, fecha, serviceIndex }
        const savedConfigsStub: any[] = [];
        selectedDates.forEach(dateStr => {
          const dayConfigs = serviceConfigs[dateStr] || [];
          dayConfigs.forEach((_, idx) => {
            // We create a temporary ID to track this config
            savedConfigsStub.push({
              id: `temp-${dateStr}-${idx}`,
              fecha: dateStr,
              serviceIndex: idx
            });
          });
        });

        const result = await generateAssignments(savedConfigsStub, serviceConfigs, positions);

        // Map result to DraftAssignment
        const mapped = result.assignments.map((a: any, idx: number) => {
          // Ensure ID is unique
          // Attempt to retrieve date from ID if config object is missing/incomplete
          // But useAutoAssign returns `configuracion_dia_id` which matches what we passed in (temp id)

          return {
            id: `draft-${idx}-${Date.now()}`, // Temporary ID
            usuario_id: a.usuario_id,
            posicion_id: a.posicion_id,
            fecha: a.configuracion_dia_id.split('-').slice(1, 4).join('-'), // Extract date from temp id
            configuracion_dia_id: a.configuracion_dia_id, // Keep reference to temp config ID
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
      return; // Stop here, don't increment step manually outside
    }

    if (activeStep < 2) setActiveStep(activeStep + 1);
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
              departments={deptData?.options || []}
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
