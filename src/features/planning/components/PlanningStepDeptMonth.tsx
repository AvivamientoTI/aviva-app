import { Select, Paper, Text, Grid, ThemeIcon, Stack, Group, Alert, Button } from '@mantine/core';
import { MonthPicker } from '@mantine/dates';
import { IconBuildingCommunity, IconCalendarEvent, IconInfoCircle } from '@tabler/icons-react';

interface Props {
    departments: { value: string; label: string }[];
    selectedDept: string | null;
    setSelectedDept: (value: string | null) => void;
    selectedMonth: Date | null;
    setSelectedMonth: (value: Date | null) => void;
    headerState?: { id: number; estado: string | null } | null;
    onLoadExisting?: () => void;
}

export const PlanningStepDeptMonth = ({
    departments,
    selectedDept,
    setSelectedDept,
    selectedMonth,
    setSelectedMonth,
    headerState,
    onLoadExisting
}: Props) => {
    return (
        <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper shadow="sm" p="xl" radius="lg" withBorder h="100%" style={{ backgroundColor: 'var(--mantine-color-body)', borderColor: 'var(--mantine-color-default-border)' }}>
                    <Stack align="center" gap="md">
                        <ThemeIcon size={64} radius="xl" variant="light" color="gold.6">
                            <IconBuildingCommunity size={34} />
                        </ThemeIcon>
                        <div style={{ textAlign: 'center' }}>
                            <Text size="lg" fw={800} style={{ fontFamily: 'Inter, sans-serif', color: 'var(--mantine-color-text)' }}>Departamento</Text>
                            <Text size="sm" c="dimmed" fw={500}>¿Para qué equipo estás planificando?</Text>
                        </div>
                        <Select
                            placeholder="Selecciona un departamento"
                            data={departments}
                            value={selectedDept}
                            onChange={setSelectedDept}
                            searchable
                            size="md"
                            w="100%"
                            radius="md"
                            maxDropdownHeight={200}
                        />
                    </Stack>
                </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper shadow="sm" p="xl" radius="lg" withBorder h="100%" style={{ backgroundColor: 'var(--mantine-color-body)', borderColor: 'var(--mantine-color-default-border)' }}>
                    <Stack align="center" gap="md">
                        <ThemeIcon size={64} radius="xl" variant="light" color="amber.6">
                            <IconCalendarEvent size={34} />
                        </ThemeIcon>
                        <div style={{ textAlign: 'center' }}>
                            <Text size="lg" fw={800} style={{ fontFamily: 'Inter, sans-serif', color: 'var(--mantine-color-text)' }}>Mes de Trabajo</Text>
                            <Text size="sm" c="dimmed" fw={500}>Selecciona el mes y año a planificar</Text>
                        </div>
                        <Group justify="center">
                            <MonthPicker
                                value={selectedMonth}
                                onChange={(val) => setSelectedMonth(val as any)}
                                locale="es"
                                size="md"
                            />
                        </Group>

                        {headerState && (
                            <Alert mt="lg" icon={<IconInfoCircle size={16} />} title="¡Rol Encontrado!" color="blue" variant="light" style={{ width: '100%' }}>
                                <Text size="sm" mb="sm">
                                    El sistema detectó que ya existe un rol en estado <b>{headerState.estado}</b> para este mes y departamento.
                                </Text>
                                <Button variant="filled" color="blue" fullWidth onClick={onLoadExisting}>
                                    Cargar Rol Existente
                                </Button>
                            </Alert>
                        )}
                    </Stack>
                </Paper>
            </Grid.Col>
        </Grid>
    );
};

