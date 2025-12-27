import { useMemo } from 'react';
import { Box, Text, Stack, Group, ThemeIcon, Button } from '@mantine/core';
import { IconStar, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

interface Assignment {
    id: string | number;
    usuario_id: string | number;
    nombre: string;
    posicion: string;
    orden?: number;
}

function groupByRole(assignments: Assignment[] = []) {
    return assignments.reduce((acc, asig) => {
        const rol = asig.posicion || 'Sin rol';
        const currentOrden = Number(asig.orden ?? 999);

        if (!acc[rol]) {
            acc[rol] = {
                items: [],
                orden: currentOrden
            };
        } else {
            // Mantener el orden más bajo encontrado para este rol
            if (currentOrden < acc[rol].orden) {
                acc[rol].orden = currentOrden;
            }
        }
        acc[rol].items.push(asig);
        return acc;
    }, {} as Record<string, { items: Assignment[], orden: number }>);
}

interface RoleSectionProps {
    rol: string;
    servidores: Assignment[];
}

function RoleSection({ rol, servidores }: RoleSectionProps) {
    const [opened, { toggle }] = useDisclosure(false);
    const isEncargado = rol.toLowerCase().includes('encargado');
    const visibleServers = opened ? servidores : servidores.slice(0, 3);

    return (
        <Box mb={12}>
            <Group mb={6} justify="center" gap={6} style={{
                width: '100%',
                background: isEncargado ? 'linear-gradient(90deg, #fef08a 0%, #fde047 100%)' : '#e0e7ff',
                color: isEncargado ? '#b45309' : '#3730a3',
                fontWeight: 800,
                fontSize: '13px',
                borderRadius: '6px',
                padding: '4px 0',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                boxShadow: isEncargado ? '0 1px 8px rgba(251, 191, 36, 0.15)' : '0 1px 4px rgba(59, 130, 246, 0.07)',
                textAlign: 'center',
                border: isEncargado ? '2px solid #f59e0b' : 'none',
                position: 'relative',
            }}>
                {isEncargado && (
                    <ThemeIcon size="sm" radius="xl" color="yellow" variant="filled">
                        <IconStar size={16} style={{ fill: '#f59e0b' }} />
                    </ThemeIcon>
                )}
                <Text style={{ fontWeight: 900 }}>{rol}</Text>
            </Group>
            <Stack gap={6}>
                {visibleServers.map((asig, i) => (
                    <Box
                        key={`${rol}-${i}`}
                        style={{
                            padding: '4px 0',
                            marginLeft: 4
                        }}
                    >
                        <Text
                            size="13px"
                            fw={isEncargado ? 900 : 600}
                            c={isEncargado ? '#b45309' : '#1e293b'}
                            style={{ lineHeight: 1.4 }}
                        >
                            {asig.nombre}
                        </Text>
                    </Box>
                ))}
            </Stack>
            {servidores.length > 3 && (
                <Button
                    mt={6}
                    fullWidth
                    variant="light"
                    color="blue"
                    size="xs"
                    onClick={toggle}
                    rightSection={opened ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                >
                    {opened ? 'Ver menos' : `Ver ${servidores.length - 3} más`}
                </Button>
            )}
        </Box>
    );
}

interface ServersListProps {
    assignments: Assignment[];
}

export function ServersList({ assignments }: ServersListProps) {
    const grouped = useMemo(() => groupByRole(assignments), [assignments]);
    const entries = Object.entries(grouped).sort(([nameA, groupA], [nameB, groupB]) => {
        const valA = Number(groupA.orden);
        const valB = Number(groupB.orden);

        // Si uno es NaN, ponerlo al final
        if (isNaN(valA) && !isNaN(valB)) return 1;
        if (!isNaN(valA) && isNaN(valB)) return -1;
        if (isNaN(valA) && isNaN(valB)) return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });

        if (valA !== valB) return valA - valB;

        return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    });

    return (
        <Box p="sm" style={{ flex: 1 }}>
            {entries.map(([rol, group]) => (
                <RoleSection key={rol} rol={rol} servidores={group.items} />
            ))}
        </Box>
    );
}
