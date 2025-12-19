import { Select, Paper, Text, Grid, ThemeIcon, Stack, Group } from '@mantine/core';
import { DatePicker, MonthPicker } from '@mantine/dates';
import { IconBuildingCommunity, IconCalendarEvent } from '@tabler/icons-react';

export const PlanningStepDeptMonth = ({
    departments,
    selectedDept,
    setSelectedDept,
    selectedMonth,
    setSelectedMonth
}) => {
    return (
        <Grid gutter="xl">
            <Grid.Col sm={12} md={6}>
                <Paper shadow="sm" p="xl" radius="md" withBorder h="100%">
                    <Stack align="center" spacing="md">
                        <ThemeIcon size={60} radius="xl" variant="light" color="blue">
                            <IconBuildingCommunity size={34} />
                        </ThemeIcon>
                        <div style={{ textAlign: 'center' }}>
                            <Text size="lg" fw={600}>Departamento</Text>
                            <Text size="sm" c="dimmed">¿Para qué equipo estás planificando?</Text>
                        </div>
                        <Select
                            placeholder="Selecciona un departamento"
                            data={departments}
                            value={selectedDept}
                            onChange={setSelectedDept}
                            searchable
                            size="md"
                            w="100%"
                            maxDropdownHeight={200}
                        />
                    </Stack>
                </Paper>
            </Grid.Col>

            <Grid.Col sm={12} md={6}>
                <Paper shadow="sm" p="xl" radius="md" withBorder h="100%">
                    <Stack align="center" spacing="md">
                        <ThemeIcon size={60} radius="xl" variant="light" color="grape">
                            <IconCalendarEvent size={34} />
                        </ThemeIcon>
                        <div style={{ textAlign: 'center' }}>
                            <Text size="lg" fw={600}>Mes de Trabajo</Text>
                            <Text size="sm" c="dimmed">Selecciona el mes y año a planificar</Text>
                        </div>
                        <Group justify="center">
                            <MonthPicker
                                value={selectedMonth}
                                onChange={setSelectedMonth}
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

