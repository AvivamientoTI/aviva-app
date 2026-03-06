import React, { useState, useEffect } from 'react';
import { Table, Button, Group, Modal, TextInput, NumberInput, Title, Text, Alert, Stack, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { supabase } from '../../services/supabaseClient';
import { PositionsManager } from './PositionsManager.tsx';
import { UniformsManager } from './UniformsManager.tsx';
import { usePermissions } from '../../hooks/usePermissions';
import { TableSkeleton } from '../../components/TableSkeleton';

interface Department {
    id: number;
    nombre: string;
    prioridad: number | null;
}

export function DepartmentsList() {
    const permissions = usePermissions();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState({ nombre: '', prioridad: 2 });
    const [loading, setLoading] = useState(false);

    // Positions Modal State
    const [positionsModalOpen, { open: openPositions, close: closePositions }] = useDisclosure(false);
    const [selectedDeptForPositions, setSelectedDeptForPositions] = useState<Department | null>(null);

    // Uniforms Modal State
    const [uniformsModalOpen, { open: openUniforms, close: closeUniforms }] = useDisclosure(false);
    const [selectedDeptForUniforms, setSelectedDeptForUniforms] = useState<Department | null>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        const { data, error } = await supabase
            .from('departamentos')
            .select('*')
            .order('id');

        if (error) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } else {
            setDepartments(data || []);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let error;
        if (editingDept) {
            const { error: updateError } = await supabase
                .from('departamentos')
                .update(formData)
                .eq('id', editingDept.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('departamentos')
                .insert(formData);
            error = insertError;
        }

        if (error) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } else {
            notifications.show({ title: 'Éxito', message: 'Departamento guardado', color: 'green' });
            close();
            resetForm();
            fetchDepartments();
        }
        setLoading(false);
    };

    const confirmDelete = async () => {
        if (!deptToDelete) return;

        setLoading(true);
        const { error } = await supabase.from('departamentos').delete().eq('id', deptToDelete.id);

        if (error) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } else {
            notifications.show({ title: 'Eliminado', message: 'Departamento eliminado correctamente', color: 'green' });
            fetchDepartments();
        }
        setLoading(false);
        setDeleteModalOpen(false);
        setDeptToDelete(null);
    };

    const openDeleteModal = (dept: Department) => {
        setDeptToDelete(dept);
        setDeleteModalOpen(true);
    };

    const handleEdit = (dept: Department) => {
        setEditingDept(dept);
        setFormData({ nombre: dept.nombre, prioridad: Number(dept.prioridad) });
        open();
    };

    const handleManagePositions = (dept: Department) => {
        setSelectedDeptForPositions(dept);
        openPositions();
    };

    const handleManageUniforms = (dept: Department) => {
        setSelectedDeptForUniforms(dept);
        openUniforms();
    };

    const resetForm = () => {
        setEditingDept(null);
        setFormData({ nombre: '', prioridad: 2 });
    };

    return (
        <div>
            <Group justify="space-between" mb="lg">
                <Stack gap={0}>
                    <Title order={2} style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a', letterSpacing: '-0.02em' }}>Departamentos</Title>
                    <Text c="slate.5" size="sm" fw={500}>Gestión de equipos y prioridades del sistema</Text>
                </Stack>
                <Button
                    onClick={() => { resetForm(); open(); }}
                    disabled={!permissions.canManageAllDepartments}
                    radius="md"
                    size="md"
                >
                    Nuevo Departamento
                </Button>
            </Group>

            {!permissions.canManageAllDepartments && (
                <Alert color="yellow" title="Acceso limitado" mb="md">
                    Solo el líder de Servicio General puede crear/editar departamentos.
                </Alert>
            )}

            {departments.length === 0 && loading ? (
                 <TableSkeleton rows={4} columns={4} />
            ) : (
                <Table.ScrollContainer minWidth={500}>
                    <Table highlightOnHover style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        <Table.Thead style={{ backgroundColor: '#f8fafc' }}>
                        <Table.Tr>
                            <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>ID</Table.Th>
                            <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Nombre</Table.Th>
                            <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Prioridad</Table.Th>
                            <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', textAlign: 'right' }}>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {departments.map((dept) => (
                            <Table.Tr key={dept.id}>
                                <Table.Td fw={700} c="slate.8">#{dept.id}</Table.Td>
                                <Table.Td fw={700} c="slate.9">{dept.nombre}</Table.Td>
                                <Table.Td>
                                    {Number(dept.prioridad) === 1 ? (
                                        <Badge color="red" variant="light" radius="sm" fw={800}>CRÍTICA (1)</Badge>
                                    ) : (
                                        <Badge color="gold" variant="light" radius="sm" fw={800} c="gold.9">NORMAL (2)</Badge>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs" justify="flex-end">
                                        <Button variant="light" size="xs" radius="sm" onClick={() => handleManagePositions(dept)} disabled={!permissions.canManagePositions(dept.id)}>
                                            Posiciones
                                        </Button>
                                        <Button variant="light" color="orange" size="xs" radius="sm" onClick={() => handleManageUniforms(dept)} disabled={!permissions.canManageDepartment(dept.id)}>
                                            Uniformes
                                        </Button>
                                        <Button variant="filled" color="blue" size="xs" radius="sm" onClick={() => handleEdit(dept)} disabled={!permissions.canManageDepartment(dept.id)}>
                                            Editar
                                        </Button>
                                        <Button variant="filled" color="red" size="xs" radius="sm" onClick={() => openDeleteModal(dept)} disabled={!permissions.canManageDepartment(dept.id)}>
                                            Eliminar
                                        </Button>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Table.ScrollContainer>
            )}

            <Modal opened={opened} onClose={close} title={editingDept ? "Editar Departamento" : "Nuevo Departamento"}>
                <form onSubmit={handleSubmit}>
                    <TextInput
                        label="Nombre"
                        placeholder="Ej. Servidores AM"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />

                    <NumberInput
                        label="Prioridad"
                        description="1 = Servicio General (Bloquea al usuario), 2 = Otros"
                        min={1}
                        max={2}
                        mt="md"
                        value={formData.prioridad}
                        onChange={(val) => setFormData({ ...formData, prioridad: Number(val) })}
                    />

                    <Group justify="flex-end" mt="xl">
                        <Button variant="default" onClick={close}>Cancelar</Button>
                        <Button type="submit" loading={loading}>Guardar</Button>
                    </Group>
                </form>
            </Modal>

            <Modal
                opened={positionsModalOpen}
                onClose={closePositions}
                title={`Posiciones: ${selectedDeptForPositions?.nombre || ''}`}
                size="lg"
            >
                <PositionsManager departmentId={selectedDeptForPositions?.id} />
            </Modal>

            <Modal
                opened={uniformsModalOpen}
                onClose={closeUniforms}
                title={`Uniformes: ${selectedDeptForUniforms?.nombre || ''}`}
                size="md"
            >
                <UniformsManager departmentId={selectedDeptForUniforms?.id} />
            </Modal>

            <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar Eliminación" centered>
                <Text size="sm">
                    ¿Estás seguro de que deseas eliminar el departamento <strong>{deptToDelete?.nombre}</strong>?
                    <br /><br />
                    <span style={{ color: 'red' }}>⚠️ Esta acción podría afectar planificaciones y miembros existentes.</span>
                </Text>
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
                    <Button color="red" onClick={confirmDelete} loading={loading}>Eliminar</Button>
                </Group>
            </Modal>
        </div>
    );
}
