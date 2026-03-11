import { useState } from 'react';
import { Avatar, Badge, Center, Group, Paper, RingProgress, Stack, Table, Text, ThemeIcon, ActionIcon, Modal, Button, Select } from '@mantine/core';
import { IconCheck, IconUser, IconCalendar, IconTrash, IconEdit, IconAlertCircle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';
import { usePlanning, type DraftAssignment } from '../context/PlanningContext';
import { useDepartmentUsers } from '../hooks/useDepartmentUsers';
import { notifications } from '@mantine/notifications';
import { getUsersNotAssignedOnDate } from '../../../utils/exclusionLogic';

const normalize = (s: string) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || '';

// --- Helper: extraer fecha de forma robusta ---
function getAssignmentDate(a: DraftAssignment): string {
    if (a.fecha) return a.fecha;
    if (typeof a.configuracion_dia_id === 'string' && a.configuracion_dia_id.startsWith('temp-')) {
        const parts = a.configuracion_dia_id.split('-');
        // temp-YYYY-MM-DD-idx → parts[1]-parts[2]-parts[3]
        if (parts.length >= 4) return `${parts[1]}-${parts[2]}-${parts[3]}`;
    }
    return '';
}

// --- Helper: filtrar candidatos según disponibilidad, género y rol ---
function buildCandidates(
    allUsers: any[],
    editingAssignment: DraftAssignment,
    previewAssignments: DraftAssignment[],
    blockedIds: Set<string>
): { value: string; label: string }[] {
    const pos = editingAssignment.posicion;
    const date = getAssignmentDate(editingAssignment);
    const currentUserId = String(editingAssignment.usuario_id);

    let candidates = [...allUsers];

    // 1. GLOBAL: Excluir bloqueados en BD (otros deptos/ausencias).
    //    La persona actual del puesto siempre es opción válida.
    candidates = candidates.filter(u =>
        String(u.id) === currentUserId || !blockedIds.has(String(u.id))
    );

    // 2. LOCAL: Excluir quienes ya están en el borrador ese mismo día.
    //    La persona actual puede quedar (para confirmarla sin cambio).
    if (date) {
        const assignedTodayInDraft = new Set(
            previewAssignments
                .filter(a => getAssignmentDate(a) === date && a.id !== editingAssignment.id)
                .map(a => String(a.usuario_id))
        );
        candidates = candidates.filter(u =>
            String(u.id) === currentUserId || !assignedTodayInDraft.has(String(u.id))
        );
    }

    // 3. Sólo activos
    candidates = candidates.filter(u => u.activo !== false);

    if (pos) {
        // 4. Género
        if (pos.genero_requerido === 'M') candidates = candidates.filter(u => u.genero === 'M');
        else if (pos.genero_requerido === 'F') candidates = candidates.filter(u => u.genero === 'F');

        // 5. Liderazgo para posiciones Encargado
        if (normalize(pos.nombre || '').includes('encargado')) {
            const leaderRoles = ['lider', 'sublider', 'encargado', 'liderazgo'];
            candidates = candidates.filter(u => leaderRoles.includes(normalize(u.rol_jerarquico)));
        }
    }

    return candidates.map(u => ({
        value: String(u.id),
        label: `${u.nombre} ${u.apellido} (${u.rol_jerarquico || 'Miembro'})`
    }));
}

export const PlanningStepReview = () => {
    const {
        previewAssignments,
        setPreviewAssignments,
        serviceConfigs,
        selectedDeptId
    } = usePlanning();

    const { data: deptUsers } = useDepartmentUsers(selectedDeptId);

    // --- Modal State ---
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<DraftAssignment | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
    // Opciones calculadas de forma determinista en openEdit, no en useMemo
    const [selectOptions, setSelectOptions] = useState<{ value: string; label: string }[]>([]);

    const handleDelete = (id: string) => {
        setPreviewAssignments((prev) => prev.filter(a => a.id !== id));
        notifications.show({
            title: 'Asignación Removida',
            message: 'Se ha eliminado la asignación del servidor.',
            color: 'red',
            icon: <IconTrash size={18} />,
        });
    };

    const openEdit = async (assignment: DraftAssignment) => {
        setIsLoadingGlobal(true);
        setSelectOptions([]);
        setEditModalOpen(true); // Abrir modal YA con spinner
        setEditingAssignment(assignment);
        setSelectedUserId(String(assignment.usuario_id));

        const dateToCheck = getAssignmentDate(assignment);
        const allUsers = deptUsers || [];

        try {
            // Obtener bloqueados globalmente (asignaciones en otros deptos + ausencias)
            const blockedIds = new Set<string>();
            if (dateToCheck) {
                const available = await getUsersNotAssignedOnDate(dateToCheck, allUsers);
                const availableIds = new Set(available.map(u => String(u.id)));
                allUsers.forEach(u => {
                    if (!availableIds.has(String(u.id))) blockedIds.add(String(u.id));
                });
            }

            // Calcular opciones con todos los filtros aplicados
            const options = buildCandidates(allUsers, assignment, previewAssignments, blockedIds);
            setSelectOptions(options);
        } catch (err) {
            console.error('Error calculando opciones de sustitución:', err);
            // Si falla el check global, al menos aplicar filtros locales
            const options = buildCandidates(allUsers, assignment, previewAssignments, new Set());
            setSelectOptions(options);
        } finally {
            setIsLoadingGlobal(false);
        }
    };

    const saveEdit = () => {
        if (!editingAssignment || !selectedUserId) return;

        const selectedUser = deptUsers?.find(u => String(u.id) === selectedUserId);
        if (!selectedUser) return;

        // Check for duplicates in same date within the draft
        const isDuplicate = previewAssignments.some(a =>
            a.id !== editingAssignment.id &&
            a.fecha === editingAssignment.fecha &&
            String(a.usuario_id) === String(selectedUser.id)
        );

        if (isDuplicate) {
            notifications.show({
                title: 'Conflicto Detectado',
                message: `${selectedUser.nombre} ya tiene una asignación en esta fecha.`,
                color: 'orange',
                icon: <IconAlertCircle size={18} />
            });
            // We allow proceeding but warn the user. Or return to block.
            // For now, let's just warn but allow, or maybe ask for confirmation?
            // Simpler to just warn and let them decide, or block. 
            // Blocking is safer for a "wizard".
            return;
        }

        setPreviewAssignments((prev) => prev.map(a => {
            if (a.id === editingAssignment.id) {
                return {
                    ...a,
                    usuario_id: selectedUser.id,
                    usuario: {
                        nombre: selectedUser.nombre,
                        apellido: selectedUser.apellido
                    }
                };
            }
            return a;
        }));

        notifications.show({
            title: 'Asignación Actualizada',
            message: `Se ha asignado a ${selectedUser.nombre} ${selectedUser.apellido}.`,
            color: 'teal',
            icon: <IconCheck size={18} />
        });

        setEditModalOpen(false);
        setEditingAssignment(null);
    };

    if (previewAssignments.length === 0) {
        return (
            <Paper p="xl" withBorder style={{ textAlign: 'center', opacity: 0.7 }}>
                <IconUser size={48} />
                <Text mt="md">No se generaron asignaciones.</Text>
                <Text size="sm" c="dimmed">Vuelve atrás y revisa la configuración de fechas y cupos.</Text>
            </Paper>
        );
    }

    // Group assignments by Date -> Service Index
    const grouped: Record<string, Record<number, DraftAssignment[]>> = {};

    previewAssignments.forEach(a => {
        const dateStr = a.fecha;
        if (!dateStr) return;

        let sIdx = 0;
        if (typeof a.configuracion_dia_id === 'string' && a.configuracion_dia_id.startsWith('temp-')) {
            const parts = a.configuracion_dia_id.split('-');
            if (parts.length >= 2) {
                const lastPart = parts[parts.length - 1];
                sIdx = parseInt(lastPart) || 0;
            }
        } else if (a.id.startsWith('draft-')) {
            // draft-idx-timestamp: defaults to service 0
            sIdx = 0;
        }

        if (!grouped[dateStr]) grouped[dateStr] = {};
        if (!grouped[dateStr][sIdx]) grouped[dateStr][sIdx] = [];
        grouped[dateStr][sIdx].push(a);
    });

    const sortedDates = Object.keys(grouped).sort();
    const uniqueUsers = new Set(previewAssignments.map(a => a.usuario_id)).size;
    const totalAssignments = previewAssignments.length;

    return (
        <Stack gap="xl">
            {/* Stats Summary */}
            <Group grow>
                <Paper p="md" radius="lg" withBorder bg="var(--mantine-color-body)">
                    <Group>
                        <RingProgress
                            size={60}
                            roundCaps
                            thickness={6}
                            sections={[{ value: 100, color: 'gold.6' }]}
                            label={<Center><IconUser size={20} color="var(--mantine-color-gold-6)" /></Center>}
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Voluntarios</Text>
                            <Text fw={900} size="xl" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--mantine-color-text)', lineHeight: 1 }}>{uniqueUsers}</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper p="md" radius="lg" withBorder bg="var(--mantine-color-body)">
                    <Group>
                        <RingProgress
                            size={60}
                            roundCaps
                            thickness={6}
                            sections={[{ value: 100, color: 'teal.4' }]}
                            label={<Center><IconCheck size={20} color="var(--mantine-color-teal-4)" /></Center>}
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Asignaciones</Text>
                            <Text fw={900} size="xl" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--mantine-color-text)', lineHeight: 1 }}>{totalAssignments}</Text>
                        </div>
                    </Group>
                </Paper>
            </Group>

            {/* Render Groups */}
            <Stack gap="lg">
                {sortedDates.map(dateKey => {
                    const servicesMap = grouped[dateKey];
                    const serviceIndices = Object.keys(servicesMap).map(Number).sort((a, b) => a - b);
                    const displayDate = dayjs(dateKey).locale('es');

                    return (
                        <Paper key={dateKey} shadow="sm" radius="lg" withBorder style={{ overflow: 'hidden' }}>
                            {/* Date Header */}
                            <div style={{ backgroundColor: 'var(--mantine-color-default-hover)', padding: '12px 20px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                <Group justify="space-between">
                                    <Group gap="xs">
                                        <IconCalendar size={20} style={{ color: 'var(--mantine-color-dimmed)' }} />
                                        <Text fw={800} size="lg" c="text" tt="capitalize">
                                            {displayDate.format('dddd, D [de] MMMM')}
                                        </Text>
                                    </Group>
                                    <Badge variant="default" size="lg" radius="sm">
                                        {Object.values(servicesMap).flat().length} Asignaciones
                                    </Badge>
                                </Group>
                            </div>

                            <Stack gap={0}>
                                {serviceIndices.map((sIdx, idx) => {
                                    const serviceAssignments = servicesMap[sIdx];
                                    const configs = serviceConfigs[dateKey] || [];
                                    const config = configs[sIdx] || { type: 'Generado', uniform: 'N/A' };

                                    return (
                                        <div key={sIdx} style={{
                                            borderTop: idx > 0 ? '2px dashed var(--mantine-color-default-border)' : 'none',
                                            padding: 0
                                        }}>
                                            {/* Service Sub-Header */}
                                            <div style={{ padding: '16px 20px', backgroundColor: 'var(--mantine-color-body)', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                                <Group justify="space-between">
                                                    <Group gap="md">
                                                        <ThemeIcon size={36} radius="md" color={sIdx === 0 ? 'blue' : 'orange'} variant="light">
                                                            <Text fw={900} size="sm">#{sIdx + 1}</Text>
                                                        </ThemeIcon>

                                                        <Badge
                                                            size="lg" radius="sm" variant="filled"
                                                            color={sIdx === 0 ? 'blue' : 'orange'}
                                                            className="shadow-sm"
                                                            style={{ fontSize: '14px', height: '28px' }}
                                                        >
                                                            {config.type}
                                                        </Badge>

                                                        <Badge
                                                            variant="light"
                                                            color={getUniformeColor(config.uniform)}
                                                            size="lg" radius="sm"
                                                            style={{ fontSize: '14px', height: '28px' }}
                                                            leftSection={<div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: `var(--mantine-color-${getUniformeColor(config.uniform)}-6)` }}></div>}
                                                        >
                                                            {config.uniform}
                                                        </Badge>
                                                    </Group>
                                                </Group>
                                            </div>

                                            {/* Assignments Table */}
                                            <Table verticalSpacing="sm">
                                                <Table.Tbody>
                                                    {serviceAssignments.map(assignment => (
                                                        <Table.Tr key={assignment.id}>
                                                            <Table.Td width="40%" style={{ paddingLeft: 20 }}>
                                                                <Group gap="sm">
                                                                    <Avatar color="gold" radius="xl" size="sm">
                                                                        {assignment.usuario?.nombre?.[0]}{assignment.usuario?.apellido?.[0]}
                                                                    </Avatar>
                                                                    <div>
                                                                        <Text size="sm" fw={600} c="text">{assignment.usuario?.nombre} {assignment.usuario?.apellido}</Text>
                                                                    </div>
                                                                </Group>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Text size="sm" c="dimmed">Posición:</Text>
                                                                <Text size="sm" fw={700} c="text">{assignment.posicion?.nombre || 'Voluntario'}</Text>
                                                            </Table.Td>
                                                            <Table.Td align="right" style={{ paddingRight: 20 }}>
                                                                <Group gap="xs" justify="flex-end">
                                                                    <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(assignment)} aria-label="Editar">
                                                                        <IconEdit size={18} />
                                                                    </ActionIcon>
                                                                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(assignment.id)} aria-label="Eliminar">
                                                                        <IconTrash size={18} />
                                                                    </ActionIcon>
                                                                </Group>
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    ))}
                                                </Table.Tbody>
                                            </Table>
                                        </div>
                                    );
                                })}
                            </Stack>
                        </Paper>
                    );
                })}
            </Stack>

            {/* Edit Modal */}
            <Modal
                opened={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Editar Asignación"
                radius="lg"
            >
                <Stack>
                    {editingAssignment && (
                        <Paper withBorder p="sm" bg="var(--mantine-color-default)">
                            <Text size="xs" c="dimmed">Posición Actual</Text>
                            <Text fw={600} size="sm">{editingAssignment.posicion?.nombre}</Text>
                            <Text size="xs" c="dimmed" mt={4}>Fecha</Text>
                            <Text fw={600} size="sm">{dayjs(editingAssignment.fecha).format('DD/MM/YYYY')}</Text>
                        </Paper>
                    )}

                    <Select
                        key={`${editingAssignment?.id}-${isLoadingGlobal}`}
                        label="Seleccionar Voluntario"
                        placeholder={isLoadingGlobal ? "Verificando disponibilidad..." : "Buscar usuario..."}
                        searchable
                        data={selectOptions}
                        value={selectedUserId}
                        onChange={setSelectedUserId}
                        disabled={isLoadingGlobal}
                        nothingFoundMessage={isLoadingGlobal ? "Consultando base de datos..." : "No hay servidores disponibles para esta posición/fecha"}
                        maxDropdownHeight={220}
                        leftSection={isLoadingGlobal ? <IconCalendar size={16} className="animate-spin" /> : <IconUser size={16} />}
                        description={editingAssignment?.posicion ?
                            `REQUISITOS: ${editingAssignment.posicion.genero_requerido && editingAssignment.posicion.genero_requerido !== 'A' ? `Solo ${editingAssignment.posicion.genero_requerido === 'M' ? 'Hombres' : 'Mujeres'}, ` : ''}${normalize(editingAssignment.posicion.nombre || '').includes('encargado') ? 'Solo Liderazgo, ' : ''}Sin conflictos.`
                            : ''}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                        <Button color="gold" c="black" onClick={saveEdit}>Guardar Cambios</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};
