import React from 'react';
import { Stack, Group, Title, Text, Table, Badge, Paper, ThemeIcon, Divider } from '@mantine/core';
import { IconCalendar, IconChecklist, IconShirt, IconPray } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

interface PersonalRoleTemplateProps {
    userName: string;
    month: number;
    year: number;
    assignments: any[];
}

export const PersonalRoleTemplate = React.forwardRef<HTMLDivElement, PersonalRoleTemplateProps>(({
    userName,
    month,
    year,
    assignments
}, ref) => {
    const reportDate = dayjs(`${year}-${month}-01`).format('MMMM YYYY');

    return (
        <div
            style={{
                padding: '50px',
                background: 'white',
                color: '#1a1a1a',
                width: '800px',
                minHeight: '1100px',
                fontFamily: 'Outfit, sans-serif'
            }}
            ref={ref}
        >
            <Stack gap="xl">
                {/* Header Section */}
                <Group justify="space-between" align="flex-start">
                    <Stack gap={0}>
                        <Title order={1} style={{ color: '#78350f', fontSize: '2.8rem', letterSpacing: '-0.03em' }}>
                            Mi Rol de Servicio
                        </Title>
                        <Text size="xl" fw={800} c="stone.8">{userName}</Text>
                        <Text size="md" c="dimmed" mt={4} fw={600} tt="capitalize">{reportDate}</Text>
                    </Stack>
                    <ThemeIcon size={80} radius="xl" variant="light" color="gold">
                        <IconCalendar size={48} />
                    </ThemeIcon>
                </Group>

                <Divider size="md" color="gold.2" />

                {/* Summary Box */}
                <Paper withBorder p="lg" radius="lg" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                    <Group justify="space-around">
                        <Stack align="center" gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Total Servicios</Text>
                            <Text size="xl" fw={900} c="gold.9">{assignments.length}</Text>
                        </Stack>
                        <Divider orientation="vertical" />
                        <Stack align="center" gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Próximo</Text>
                            <Text size="sm" fw={800} c="stone.7">
                                {assignments[0] ? dayjs(assignments[0].configuracion_dia?.fecha).format('D [de] MMM') : 'N/A'}
                            </Text>
                        </Stack>
                    </Group>
                </Paper>

                {/* Detailed Table */}
                <Stack gap="md">
                    <Group gap="xs">
                        <IconChecklist size={24} color="#d97706" />
                        <Title order={3} c="stone.8">Detalle de Asignaciones</Title>
                    </Group>

                    <Table verticalSpacing="lg" highlightOnHover>
                        <thead style={{ background: '#fcfaf5', borderBottom: '2px solid #e7e5e4' }}>
                            <tr>
                                <th style={{ padding: '20px', color: '#78716c', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800 }}>Día y Fecha</th>
                                <th style={{ color: '#78716c', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800 }}>Servicio / Depto.</th>
                                <th style={{ color: '#78716c', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800 }}>Posición</th>
                                <th style={{ color: '#78716c', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800 }}>Uniforme</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map((a) => {
                                const config = a.configuracion_dia;
                                const pos = a.posicion;
                                const dept = pos?.departamento;
                                const date = dayjs(config?.fecha);

                                return (
                                    <tr key={a.id} style={{ borderBottom: '1px solid #e7e5e4' }}>
                                        <td style={{ padding: '20px' }}>
                                            <Stack gap={0}>
                                                <Text fw={800} color="#78350f" tt="capitalize">{date.format('dddd')}</Text>
                                                <Text size="sm" c="dimmed">{date.format('D [de] MMMM')}</Text>
                                            </Stack>
                                        </td>
                                        <td>
                                            <Stack gap={0}>
                                                <Text fw={700} color="stone.8">{config?.tipo_servicio}</Text>
                                                <Text size="xs" fw={800} c="gold.6" tt="uppercase">{dept?.nombre}</Text>
                                            </Stack>
                                        </td>
                                        <td>
                                            <Badge variant="light" color="stone" size="lg" radius="sm" fw={800}>
                                                {pos?.nombre}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Group gap="xs">
                                                <IconShirt size={16} color="#4b5563" />
                                                <Text size="sm" fw={700} color="stone.7">{config?.color_uniforme}</Text>
                                            </Group>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </Stack>

                {/* Footer Quote */}
                <Stack align="center" mt="auto" gap={6} style={{ opacity: 0.9 }}>
                    <IconPray size={32} color="#d97706" />
                    <Text size="sm" fs="italic" ta="center" ml="xl" mr="xl" fw={500} c="#78716c">
                        "Sirviendo con alegría en la casa del Señor"
                    </Text>
                    <Text size="xs" fw={800} c="gold.8" style={{ letterSpacing: '0.05em' }}>EQUIPO DE UJIERES</Text>
                </Stack>
            </Stack>
        </div>
    );
});

PersonalRoleTemplate.displayName = 'PersonalRoleTemplate';
