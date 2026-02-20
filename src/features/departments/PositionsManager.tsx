import React, { useState, useEffect } from 'react';
import { Table, Button, Group, TextInput, NumberInput, Select, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import { supabase } from '../../services/supabaseClient';

interface Position {
    id: number;
    nombre: string;
    cantidad_default: number | null;
    genero_requerido: string | null;
    orden: number | null;
    departamento_id: number | null;
}

interface PositionsManagerProps {
    departmentId: number | undefined;
}

export function PositionsManager({ departmentId }: PositionsManagerProps) {
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<Position>>({});
    const [formData, setFormData] = useState({
        nombre: '',
        cantidad_default: 1,
        genero_requerido: 'A',
        orden: 999
    });

    useEffect(() => {
        if (departmentId) fetchPositions();
    }, [departmentId]);

    const fetchPositions = async () => {
        if (!departmentId) return;

        const { data, error } = await supabase
            .from('posiciones_departamento')
            .select('*')
            .eq('departamento_id', Number(departmentId))
            .order('orden', { ascending: true })
            .order('nombre', { ascending: true });

        if (error) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } else {
            setPositions(data || []);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre.trim()) return;

        if (!departmentId) return;

        setLoading(true);
        const { error } = await supabase
            .from('posiciones_departamento')
            .insert({
                ...formData,
                departamento_id: departmentId
            });

        if (error) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } else {
            notifications.show({ title: 'Éxito', message: 'Posición agregada', color: 'green' });
            setFormData({ nombre: '', cantidad_default: 1, genero_requerido: 'A', orden: 0 });
            fetchPositions();
        }
        setLoading(false);
    };

    const handleEdit = (pos: Position) => {
        setEditingId(pos.id);
        setEditFormData({
            cantidad_default: pos.cantidad_default,
            genero_requerido: pos.genero_requerido,
            orden: pos.orden
        });
    };

    const handleUpdate = async () => {
        if (editingId === null) return;

        setLoading(true);
        const { error } = await supabase
            .from('posiciones_departamento')
            .update(editFormData)
            .eq('id', editingId);

        if (error) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } else {
            notifications.show({ title: 'Éxito', message: 'Posición actualizada', color: 'green' });
            setEditingId(null);
            fetchPositions();
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Eliminar esta posición?')) return;

        const { error } = await supabase
            .from('posiciones_departamento')
            .delete()
            .eq('id', id);

        if (error) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } else {
            fetchPositions();
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <Group align="flex-end" mb="md">
                    <TextInput
                        label="Nombre Posición"
                        placeholder="Ej: Altar Izquierdo"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                        style={{ flex: 2 }}
                    />
                    <NumberInput
                        label="Cantidad"
                        value={Number(formData.cantidad_default)}
                        onChange={(val) => setFormData({ ...formData, cantidad_default: Number(val) })}
                        min={1}
                        style={{ flex: 1 }}
                    />
                    <Select
                        label="Género"
                        value={formData.genero_requerido}
                        onChange={(val) => setFormData({ ...formData, genero_requerido: val || 'A' })}
                        data={[
                            { value: 'A', label: 'Cualquiera' },
                            { value: 'M', label: 'Hombres' },
                            { value: 'F', label: 'Mujeres' }
                        ]}
                        style={{ flex: 1 }}
                    />
                    <NumberInput
                        label="Orden"
                        value={Number(formData.orden)}
                        onChange={(val) => setFormData({ ...formData, orden: Number(val) })}
                        min={0}
                        style={{ width: 80 }}
                    />
                    <Button type="submit" loading={loading}>Agregar</Button>
                </Group>
            </form>

            <Table highlightOnHover style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <Table.Thead style={{ backgroundColor: '#f8fafc' }}>
                    <Table.Tr>
                        <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Nombre</Table.Th>
                        <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Asignación Base</Table.Th>
                        <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Género</Table.Th>
                        <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Orden</Table.Th>
                        <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', textAlign: 'right' }}>Acciones</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {positions.length === 0 ? (
                        <Table.Tr>
                            <Table.Td colSpan={4} align="center">No hay posiciones definidas</Table.Td>
                        </Table.Tr>
                    ) : (
                        positions.map((pos) => (
                            <Table.Tr key={pos.id}>
                                <Table.Td>{pos.nombre}</Table.Td>
                                <Table.Td>
                                    {editingId === pos.id ? (
                                        <NumberInput
                                            size="xs"
                                            value={Number(editFormData.cantidad_default)}
                                            onChange={(val) => setEditFormData({ ...editFormData, cantidad_default: Number(val) })}
                                            min={1}
                                            w={80}
                                        />
                                    ) : (
                                        pos.cantidad_default
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    {editingId === pos.id ? (
                                        <Select
                                            size="xs"
                                            value={editFormData.genero_requerido}
                                            onChange={(val) => setEditFormData({ ...editFormData, genero_requerido: val || 'A' })}
                                            data={[
                                                { value: 'A', label: 'Cualquiera' },
                                                { value: 'M', label: 'Hombres' },
                                                { value: 'F', label: 'Mujeres' }
                                            ]}
                                            w={120}
                                        />
                                    ) : (
                                        pos.genero_requerido === 'M' ? 'Hombres' :
                                            pos.genero_requerido === 'F' ? 'Mujeres' : 'Cualquiera'
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    {editingId === pos.id ? (
                                        <NumberInput
                                            size="xs"
                                            value={Number(editFormData.orden)}
                                            onChange={(val) => setEditFormData({ ...editFormData, orden: Number(val) })}
                                            min={0}
                                            w={70}
                                        />
                                    ) : (
                                        pos.orden
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        {editingId === pos.id ? (
                                            <>
                                                <ActionIcon color="green" variant="light" onClick={handleUpdate} loading={loading}>
                                                    <IconCheck size={16} />
                                                </ActionIcon>
                                                <ActionIcon color="red" variant="light" onClick={() => setEditingId(null)}>
                                                    <IconX size={16} />
                                                </ActionIcon>
                                            </>
                                        ) : (
                                            <>
                                                <ActionIcon color="gold" variant="light" onClick={() => handleEdit(pos)}>
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                                <ActionIcon color="red" variant="light" onClick={() => handleDelete(pos.id)}>
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </>
                                        )}
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))
                    )}
                </Table.Tbody>
            </Table>
        </div>
    );
}
