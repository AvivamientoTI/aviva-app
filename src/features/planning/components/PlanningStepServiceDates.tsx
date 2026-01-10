import { useMemo } from 'react';
import { DatePicker } from '@mantine/dates';
import { Accordion, Alert, Autocomplete, Badge, Button, Grid, Group, Menu, NumberInput, Paper, ScrollArea, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconCalendar, IconApps, IconCheck, IconTrash, IconInfoCircle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import type { Position } from '../../../types';

interface ServiceDateConfig {
    type: string;
    uniform: string;
    positionQuotas: Record<string, number>;
}

interface Props {
    selectedDates: string[];
    handleDateChange: (dates: Date[] | Date | string[] | null) => void;
    serviceConfigs: Record<string, ServiceDateConfig>;
    updateServiceConfig: (dateStr: string, field: keyof ServiceDateConfig, value: string) => void;
    positions: Position[];
    updatePositionQuota: (dateStr: string, posId: number | string, value: number) => void;
    selectedMonth: Date | null;
}

export const PlanningStepServiceDates = ({
    selectedDates,
    handleDateChange,
    serviceConfigs,
    updateServiceConfig,
    positions,
    updatePositionQuota,
    selectedMonth
}: Props) => {

    // Helpers for Batch Selection
    const currentMonth = useMemo(() => {
        return dayjs(selectedMonth || new Date());
    }, [selectedMonth]);

    const minDate = currentMonth.startOf('month').toDate();
    const maxDate = currentMonth.endOf('month').toDate();

    const selectAllDayOfWeek = (dayIndex: number) => { // 0 = Sunday, 1 = Monday...
        const startOfMonth = currentMonth.startOf('month');
        const endOfMonth = currentMonth.endOf('month');

        let pointer = startOfMonth;
        const newDates = new Set(selectedDates);

        while (pointer.isBefore(endOfMonth) || pointer.isSame(endOfMonth, 'day')) {
            if (pointer.day() === dayIndex) {
                newDates.add(pointer.format('YYYY-MM-DD'));
            }
            pointer = pointer.add(1, 'day');
        }

        handleDateChange(Array.from(newDates));
    };

    const clearSelection = () => handleDateChange([]);

    return (
        <Grid gutter="xl">
            {/* LEFT COLUMN: Calendar & Quick Actions */}
            <Grid.Col span={{ base: 12, md: 5, lg: 4 }}>
                <Stack gap="md" style={{ position: 'sticky', top: 20 }}>
                    <Paper shadow="sm" p="md" radius="lg" withBorder style={{ backgroundColor: 'var(--mantine-color-body)', borderColor: 'var(--mantine-color-default-border)' }}>
                        <Text fw={800} size="lg" mb="sm" ta="center" style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>Selección de Fechas</Text>
                        <Group justify="center">
                            <DatePicker
                                value={selectedDates.map(dateStr => dayjs(dateStr).hour(12).toDate())}
                                onChange={handleDateChange}

                                locale="es"
                                firstDayOfWeek={1}
                                type="multiple"
                                numberOfColumns={1}
                                size="md"
                                minDate={minDate}
                                maxDate={maxDate}
                                defaultDate={minDate}
                                styles={{
                                    calendarHeader: { maxWidth: '100%' }
                                }}
                            />
                        </Group>

                        <Menu shadow="md" width={240} position="bottom">
                            <Menu.Target>
                                <Button variant="light" fullWidth mt="md" leftSection={<IconApps size={18} />}>
                                    Selección Rápida
                                </Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>Seleccionar todos los...</Menu.Label>
                                <Menu.Item onClick={() => selectAllDayOfWeek(2)}>Martes</Menu.Item>
                                <Menu.Item onClick={() => selectAllDayOfWeek(5)}>Viernes</Menu.Item>
                                <Menu.Item onClick={() => selectAllDayOfWeek(0)}>Domingos</Menu.Item>
                                <Menu.Divider />
                                <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={clearSelection}>Limpiar Selección</Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Paper>

                    <Alert icon={<IconInfoCircle size={16} />} title="Ayuda" color="gold" variant="light" radius="md">
                        Toca las fechas en el calendario para agregarlas o quitarlas.
                    </Alert>
                </Stack>
            </Grid.Col>

            {/* RIGHT COLUMN: Configuration List */}
            <Grid.Col span={{ base: 12, md: 7, lg: 8 }}>
                <Paper shadow="sm" p="lg" radius="lg" withBorder h="100%" style={{ minHeight: 400, backgroundColor: 'var(--mantine-color-body)', borderColor: 'var(--mantine-color-default-border)' }}>
                    <Group justify="space-between" mb="lg">
                        <Text fw={800} size="xl" style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a', letterSpacing: '-0.01em' }}>Configuración de Servicios</Text>
                        <Badge size="lg" variant="light" color="gold" radius="md" fw={700} c="gold.9">{selectedDates.length} Días Seleccionados</Badge>
                    </Group>

                    {selectedDates.length === 0 && (
                        <Stack align="center" justify="center" h={300} style={{ opacity: 0.5 }}>
                            <IconCalendar size={48} />
                            <Text>Selecciona fechas en el calendario para configurar.</Text>
                        </Stack>
                    )}

                    <ScrollArea h={selectedDates.length > 5 ? 600 : 'auto'} offsetScrollbars scrollbarSize={6}>
                        <Accordion variant="separated" radius="lg" defaultValue={selectedDates.length > 0 ? selectedDates.sort()[0] : null} styles={{ item: { border: '1px solid #e2e8f0' } }}>
                            {selectedDates && Array.isArray(selectedDates) && selectedDates.sort().map(dateStr => {
                                const config = serviceConfigs[dateStr] || {};
                                const displayDate = dayjs(dateStr).hour(12);
                                const hasError = !config.type || !config.uniform || !Object.values(config.positionQuotas || {}).some(v => v > 0);

                                return (
                                    <Accordion.Item key={dateStr} value={dateStr} mb="xs">
                                        <Accordion.Control style={{ backgroundColor: '#f8fafc' }}>
                                            <Group justify="space-between">
                                                <Group>
                                                    <ThemeIcon color={hasError ? 'amber.6' : 'teal.6'} variant="light" radius="md">
                                                        {hasError ? <IconInfoCircle size={16} /> : <IconCheck size={16} />}
                                                    </ThemeIcon>
                                                    <Text fw={700} c="slate.9">{displayDate.format('dddd D [/] MMMM')}</Text>
                                                </Group>
                                                {hasError ? <Badge color="amber" variant="light" size="sm" radius="sm">Falta Info</Badge> : <Badge color="teal" variant="light" size="sm" radius="sm">Listo</Badge>}
                                            </Group>
                                        </Accordion.Control>
                                        <Accordion.Panel>
                                            <Stack gap="sm" p="xs">
                                                <Grid>
                                                    <Grid.Col span={6}>
                                                        <Autocomplete
                                                            label="Tipo de Servicio"
                                                            placeholder="Selecciona o escribe"
                                                            data={['Culto General', 'Escuela Sabática', 'Culto Joven', 'Otro']}
                                                            value={config.type}
                                                            onChange={(value) => updateServiceConfig(dateStr, 'type', value)}
                                                            size="sm"
                                                        />
                                                    </Grid.Col>
                                                    <Grid.Col span={6}>
                                                        <Autocomplete
                                                            label="Uniforme"
                                                            placeholder="Selecciona o escribe"
                                                            data={['Formal Gris', 'Formal Vino', 'Camisa Beige', 'Camisa Azul', 'Camisa Roja', 'Especial']}
                                                            value={config.uniform}
                                                            onChange={(value) => updateServiceConfig(dateStr, 'uniform', value)}
                                                            size="sm"
                                                        />
                                                    </Grid.Col>
                                                </Grid>

                                                <Text size="xs" fw={800} mt="xs" c="slate.5" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cupos Requeridos</Text>
                                                <Group gap="sm">
                                                    {positions.map(pos => {
                                                        const quota = config.positionQuotas?.[pos.id] || 0;
                                                        return (
                                                            <Paper key={pos.id} withBorder p={8} radius="md" style={{ minWidth: 90, backgroundColor: '#fcfcfd' }}>
                                                                <Stack align="center" gap={4}>
                                                                    <Text size="xs" fw={700} c="slate.6" style={{ lineHeight: 1, textAlign: 'center' }}>{pos.nombre}</Text>
                                                                    <NumberInput
                                                                        variant="unstyled"
                                                                        value={quota}
                                                                        onChange={(value) => updatePositionQuota(dateStr, pos.id, Number(value))}
                                                                        min={0}
                                                                        allowNegative={false}
                                                                        styles={{ input: { textAlign: 'center', height: 24, fontSize: 18, fontWeight: 900, color: '#d97706' } }}
                                                                    />
                                                                </Stack>
                                                            </Paper>
                                                        );
                                                    })}
                                                </Group>
                                            </Stack>
                                        </Accordion.Panel>
                                    </Accordion.Item>
                                );
                            })}
                        </Accordion>
                    </ScrollArea>
                </Paper>
            </Grid.Col>
        </Grid>
    );
};
