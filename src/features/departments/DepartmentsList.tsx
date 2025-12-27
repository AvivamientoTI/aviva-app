import React, { useState, useEffect } from 'react';
import { Table, Button, Group, Modal, TextInput, NumberInput, Title, Text, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { supabase } from '../../services/supabaseClient';
import { PositionsManager } from './PositionsManager.tsx';
import { usePermissions } from '../../hooks/usePermissions';

interface Department {
    id: number;
    nombre: string;
    prioridad: number;
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

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro? Esto podría afectar planificaciones existentes.')) {
            const { error } = await supabase.from('departamentos').delete().eq('id', id);
            if (error) {
                notifications.show({ title: 'Error', message: error.message, color: 'red' });
            } else {
                fetchDepartments();
            }
        }
    };

    const handleEdit = (dept: Department) => {
        setEditingDept(dept);
        setFormData({ nombre: dept.nombre, prioridad: dept.prioridad });
        open();
    };

    const handleManagePositions = (dept: Department) => {
        setSelectedDeptForPositions(dept);
        openPositions();
    };

    const resetForm = () => {
        setEditingDept(null);
        setFormData({ nombre: '', prioridad: 2 });
    };

    return (
        <div>
            <Group justify="space-between" mb="md">
                <Title order={2}>Departamentos</Title>
                <Button onClick={() => { resetForm(); open(); }} disabled={!permissions.canManageAllDepartments}>
                    Nuevo Departamento
                </Button>
            </Group>

            {!permissions.canManageAllDepartments && (
                <Alert color="yellow" title="Acceso limitado" mb="md">
                    Solo el líder de Servicio General puede crear/editar departamentos.
                </Alert>
            )}

            <Table.ScrollContainer minWidth={500}>
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Nombre</Table.Th>
                            <Table.Th>Prioridad</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {departments.map((dept) => (
                            <Table.Tr key={dept.id}>
                                <Table.Td>{dept.id}</Table.Td>
                                <Table.Td>{dept.nombre}</Table.Td>
                                <Table.Td>
                                    {dept.prioridad === 1 ? (
                                        <Text c="red" fw={700}>Alta (1)</Text>
                                    ) : (
                                        <Text>Normal (2)</Text>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <Button variant="light" size="xs" onClick={() => handleManagePositions(dept)} disabled={!permissions.canManagePositions(dept.id)}>
                                            Posiciones
                                        </Button>
                                        <Button variant="subtle" size="xs" onClick={() => handleEdit(dept)} disabled={!permissions.canManageAllDepartments}>
                                            Editar
                                        </Button>
                                        <Button variant="subtle" color="red" size="xs" onClick={() => handleDelete(dept.id)} disabled={!permissions.canManageAllDepartments}>
                                            Eliminar
                                        </Button>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Table.ScrollContainer>

            <Modal opened={opened} onClose={close} title={editingDept ? "Editar Departamento" : "Nuevo Departamento"}>
                <form onSubmit={handleSubmit}>
                    <TextInput
                        label="Nombre"
                        placeholder="Ej. Ujieres AM"
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
        </div>
    );
}
