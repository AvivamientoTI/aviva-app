import { useState } from 'react';
import { Avatar, Badge, Center, Group, Paper, RingProgress, Stack, Table, Text, ActionIcon, Modal, Button, Select, Tooltip } from '@mantine/core';
import { IconUser, IconCalendar, IconTrash, IconEdit, IconSparkles, IconAlertTriangle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';
import { usePlanning, type DraftAssignment } from '../context/PlanningContext';
import { useDepartmentUsers } from '../hooks/useDepartmentUsers';
import { useDepartments } from '../../../hooks/queries/useDepartments';
import { getUsersNotAssignedOnDate } from '../../../utils/exclusionLogic';
import type { PublicUser } from '../../../types';

import { formatName } from '../../../utils/formatName';
import { formatTime12h } from '../../../utils/timeFormat';

const normalize = (s: string) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || '';

// --- Helpers ---
function getAssignmentDate(a: DraftAssignment): string {
    if (a.fecha) return dayjs(a.fecha).format('YYYY-MM-DD');
    if (typeof a.configuracion_dia_id === 'string' && a.configuracion_dia_id.startsWith('temp-')) {
        const parts = a.configuracion_dia_id.split('-');
        if (parts.length >= 4) return dayjs(`${parts[1]}-${parts[2]}-${parts[3]}`).format('YYYY-MM-DD');
    }
    return '';
}

function getServiceIndex(a: DraftAssignment): number {
    if (typeof a.configuracion_dia_id === 'string' && a.configuracion_dia_id.startsWith('temp-')) {
        const parts = a.configuracion_dia_id.split('-');
        if (parts.length >= 2) return parseInt(parts[parts.length - 1]) || 0;
    }
    return 0;
}

// --- Helper: filtrar candidatos según disponibilidad, género y rol ---
function buildCandidates(
    allUsers: PublicUser[],
    editingAssignment: DraftAssignment,
    previewAssignments: DraftAssignment[],
    blockedIds: Set<string>,
    isSecurity: boolean
): { value: string; label: string }[] {
    const pos = editingAssignment.posicion;
    const dateStr = getAssignmentDate(editingAssignment);
    const currentUserId = String(editingAssignment.usuario_id);

    let candidates = allUsers.filter(u => u.activo !== false);
    candidates = candidates.filter(u => !blockedIds.has(String(u.id)));

    if (dateStr) {
        const editingSIdx = getServiceIndex(editingAssignment);

        const assignedTodayInDraft = new Set(
            previewAssignments
                .filter(a => {
                    const sameDate = getAssignmentDate(a) === dateStr;
                    const sameService = getServiceIndex(a) === editingSIdx;
                    // For Security, only block if same date AND same service.
                    // For others, block if same date (strict).
                    const isBlocked = isSecurity ? (sameDate && sameService) : sameDate;
                    return isBlocked && a.id !== editingAssignment.id;
                })
                .map(a => String(a.usuario_id))
        );
        candidates = candidates.filter(u => !assignedTodayInDraft.has(String(u.id)));
    }

    if (pos) {
        const reqGen = String(pos.genero_requerido || 'A').toUpperCase();
        if (reqGen !== 'A') {
            candidates = candidates.filter(u => String(u.genero || '').toUpperCase() === reqGen);
        }

        if (normalize(pos.nombre || '').includes('encargado')) {
            const leaderRoles = ['lider', 'sublider', 'encargado', 'liderazgo'];
            candidates = candidates.filter(u => {
                const uRole = normalize((u as any).rol_jerarquico || '');
                return leaderRoles.some(r => uRole.includes(r));
            });
        }
    }

    const finalIds = new Set(candidates.map(c => String(c.id)));
    const originalUser = allUsers.find(u => String(u.id) === currentUserId);
    if (originalUser && !blockedIds.has(currentUserId) && !finalIds.has(currentUserId)) {
        candidates.push(originalUser);
    }

    return candidates.sort((a,b) => a.nombre.localeCompare(b.nombre)).map(u => ({
        value: String(u.id),
        label: formatName(u.nombre, u.apellido)
    }));
}

export const PlanningStepReview = () => {
    const {
        previewAssignments,
        setPreviewAssignments,
        serviceConfigs,
        selectedDeptId,
        headerState
    } = usePlanning();

    const { data: deptUsers } = useDepartmentUsers(selectedDeptId);
    const { data: deptData } = useDepartments();

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<DraftAssignment | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
    const [selectOptions, setSelectOptions] = useState<{ value: string; label: string }[]>([]);

    const handleDelete = (id: string) => {
        setPreviewAssignments((prev) => prev.filter(a => a.id !== id));
    };

    const openEdit = async (assignment: DraftAssignment) => {
        setIsLoadingGlobal(true);
        setSelectOptions([]);
        setEditModalOpen(true);
        setEditingAssignment(assignment);
        setSelectedUserId(String(assignment.usuario_id));

        const dateToCheck = getAssignmentDate(assignment);
        const allUsers = (deptUsers || []) as PublicUser[];
        const currentDept = deptData?.all.find(d => String(d.id) === selectedDeptId);
        const isSecurity = currentDept?.nombre?.toLowerCase().includes('seguridad');
        const sIdx = getServiceIndex(assignment);

        try {
            const blockedIds = new Set<string>();
            if (dateToCheck) {
                const available = await getUsersNotAssignedOnDate(
                    dateToCheck, 
                    allUsers, 
                    headerState?.id, 
                    isSecurity ? sIdx : undefined
                );
                const availableIds = new Set(available.map(u => String(u.id)));
                allUsers.forEach(u => {
                    if (!availableIds.has(String(u.id))) blockedIds.add(String(u.id));
                });
            }
            const options = buildCandidates(allUsers, assignment, previewAssignments, blockedIds, !!isSecurity);
            setSelectOptions(options);
        } catch (err) {
            console.error('Error calculando opciones de sustitución:', err);
            const options = buildCandidates(allUsers, assignment, previewAssignments, new Set(), !!isSecurity);
            setSelectOptions(options);
        } finally {
            setIsLoadingGlobal(false);
        }
    };

    const saveEdit = () => {
        if (!editingAssignment || !selectedUserId) return;
        const selectedUser = deptUsers?.find(u => String(u.id) === selectedUserId);
        if (!selectedUser) return;

        setPreviewAssignments((prev) => prev.map(a => {
            if (a.id === editingAssignment.id) {
                return {
                    ...a,
                    usuario_id: selectedUser.id,
                    usuario: { ...a.usuario, nombre: selectedUser.nombre, apellido: selectedUser.apellido }
                };
            }
            return a;
        }));
        setEditModalOpen(false);
    };

    if (previewAssignments.length === 0) {
        return (
            <Paper p="xl" withBorder style={{ textAlign: 'center', opacity: 0.7 }}>
                <IconUser size={48} />
                <Text mt="md">No se generaron asignaciones.</Text>
            </Paper>
        );
    }

    const grouped: Record<string, Record<number, DraftAssignment[]>> = {};
    previewAssignments.forEach(a => {
        const dateStr = a.fecha || getAssignmentDate(a);
        if (!dateStr) return;
        let sIdx = 0;
        if (typeof a.configuracion_dia_id === 'string' && a.configuracion_dia_id.startsWith('temp-')) {
            const parts = a.configuracion_dia_id.split('-');
            if (parts.length >= 2) sIdx = parseInt(parts[parts.length - 1]) || 0;
        }
        if (!grouped[dateStr]) grouped[dateStr] = {};
        if (!grouped[dateStr][sIdx]) grouped[dateStr][sIdx] = [];
        grouped[dateStr][sIdx].push(a);
    });

    const sortedDates = Object.keys(grouped).sort();

    return (
        <Stack gap="xl">
            <Group grow>
                <Paper p="md" radius="lg" withBorder>
                    <Group>
                        <RingProgress size={60} thickness={6} sections={[{ value: 100, color: 'blue' }]} label={<Center><IconSparkles size={20} color="var(--mantine-color-blue-6)" /></Center>} />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={800}>Asistente IA</Text>
                            <Text fw={900} size="xl">Motor Activo</Text>
                        </div>
                    </Group>
                </Paper>
            </Group>

            <Stack gap="lg">
                {sortedDates.map(dateKey => {
                    const servicesMap = grouped[dateKey];
                    const serviceIndices = Object.keys(servicesMap).map(Number).sort((a, b) => a - b);
                    const displayDate = dayjs(dateKey).locale('es');

                    return (
                        <Paper key={dateKey} shadow="sm" radius="lg" withBorder style={{ overflow: 'hidden' }}>
                            <div style={{ backgroundColor: 'var(--mantine-color-default-hover)', padding: '12px 20px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                <Group justify="space-between">
                                    <Group gap="xs">
                                        <IconCalendar size={20} style={{ color: 'var(--mantine-color-dimmed)' }} />
                                        <Text fw={800} size="lg" tt="capitalize">{displayDate.format('dddd, D [de] MMMM')}</Text>
                                    </Group>
                                </Group>
                            </div>

                            <Stack gap={0}>
                                {serviceIndices.map((sIdx, idx) => {
                                    const serviceAssignments = servicesMap[sIdx];
                                    const configs = serviceConfigs[dateKey] || [];
                                    const config = configs[sIdx] || { type: 'Servicio', uniform: 'N/A' };

                                    return (
                                        <div key={sIdx} style={{ borderTop: idx > 0 ? '2px dashed var(--mantine-color-default-border)' : 'none' }}>
                                            <div style={{ padding: '16px 20px', backgroundColor: 'var(--mantine-color-body)', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                                <Group gap="md">
                                                    <Badge size="lg" color={sIdx === 0 ? 'blue' : 'orange'}>{config.type}</Badge>
                                                    <Badge variant="light" color={getUniformeColor(config.uniform)}>{config.uniform}</Badge>
                                                    {config.hora && (
                                                        <Badge variant="dot" color="gold" size="lg">
                                                            Llegada: {formatTime12h(config.hora)}
                                                        </Badge>
                                                    )}
                                                </Group>
                                            </div>

                                            <Table verticalSpacing="sm">
                                                <Table.Tbody>
                                                    {serviceAssignments.map(assignment => {
                                                        const isOverworked = (assignment.aiMetadata?.usageInPlan || 0) > 3;
                                                        return (
                                                            <Table.Tr key={assignment.id}>
                                                                <Table.Td width="45%" style={{ paddingLeft: 20 }}>
                                                                    <Group gap="sm">
                                                                        <Avatar color={isOverworked ? "red" : "gold"} radius="xl" size="sm">
                                                                            {assignment.usuario?.nombre?.[0]}
                                                                        </Avatar>
                                                                        <div>
                                                                            <Group gap={4}>
                                                                                <Text size="sm" fw={600}>{formatName(assignment.usuario?.nombre, assignment.usuario?.apellido)}</Text>
                                                                                {isOverworked && (
                                                                                    <Tooltip label="Fatiga: Sirve más de 3 veces este mes" withArrow color="red">
                                                                                        <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />
                                                                                    </Tooltip>
                                                                                )}
                                                                            </Group>
                                                                            <Group gap={4} mt={2}>
                                                                                {assignment.aiMetadata?.reasons.map((r, ri) => (
                                                                                    <Badge key={ri} variant="dot" size="xs" color="blue" styles={{ label: { textTransform: 'none' }}}>{r}</Badge>
                                                                                ))}
                                                                            </Group>
                                                                        </div>
                                                                    </Group>
                                                                </Table.Td>
                                                                <Table.Td>
                                                                    <Text size="xs" c="dimmed">Posición</Text>
                                                                    <Text size="sm" fw={700}>{assignment.posicion?.nombre || 'General'}</Text>
                                                                </Table.Td>
                                                                <Table.Td align="right" style={{ paddingRight: 20 }}>
                                                                    <Group gap="xs" justify="flex-end">
                                                                        <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(assignment)}><IconEdit size={18} /></ActionIcon>
                                                                        <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(assignment.id)}><IconTrash size={18} /></ActionIcon>
                                                                    </Group>
                                                                </Table.Td>
                                                            </Table.Tr>
                                                        );
                                                    })}
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

            <Modal opened={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Asignación" radius="lg">
                <Stack>
                    {editingAssignment && (
                        <Paper withBorder p="sm" bg="var(--mantine-color-default)">
                            <Text size="xs" c="dimmed">Posición Actual</Text>
                            <Text fw={600} size="sm">{editingAssignment.posicion?.nombre}</Text>
                        </Paper>
                    )}
                    <Select
                        label="Seleccionar Voluntario"
                        data={selectOptions}
                        value={selectedUserId}
                        onChange={setSelectedUserId}
                        searchable
                        disabled={isLoadingGlobal}
                        leftSection={isLoadingGlobal ? <IconSparkles size={16} className="animate-spin" /> : <IconUser size={16} />}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                        <Button color="gold" c="black" onClick={saveEdit}>Guardar</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};
