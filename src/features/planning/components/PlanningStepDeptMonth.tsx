import { Select, Paper, Text, Grid, ThemeIcon, Stack, Group } from '@mantine/core';
import { MonthPicker } from '@mantine/dates';
import { IconBuildingCommunity, IconCalendarEvent } from '@tabler/icons-react';

interface Props {
    departments: { value: string; label: string }[];
    selectedDept: string | null;
    setSelectedDept: (value: string | null) => void;
    selectedMonth: Date | null;
    setSelectedMonth: (value: Date | null) => void;
}

export const PlanningStepDeptMonth = ({
    departments,
    selectedDept,
    setSelectedDept,
    selectedMonth,
    setSelectedMonth
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
                            <Text size="lg" fw={800} style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>Departamento</Text>
                            <Text size="sm" c="slate.5" fw={500}>¿Para qué equipo estás planificando?</Text>
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
                            <Text size="lg" fw={800} style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>Mes de Trabajo</Text>
                            <Text size="sm" c="slate.5" fw={500}>Selecciona el mes y año a planificar</Text>
                        </div>
                        <Group justify="center">
                            <MonthPicker
                                value={selectedMonth}
                                onChange={(val) => setSelectedMonth(val as any)}
                                locale="es"
                                size="md"
                            />
                        </Group>
                    </Stack>
                </Paper>
            </Grid.Col>
        </Grid>
    );
};

