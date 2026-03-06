import React, { useState, useEffect } from 'react';
import { Table, Button, Group, TextInput, ActionIcon, Stack, Text, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconPlus, IconShirt } from '@tabler/icons-react';
import { supabase } from '../../services/supabaseClient';

interface Uniform {
    id: number;
    nombre: string;
    departamento_id: number;
}

interface UniformsManagerProps {
    departmentId: number | undefined;
}

export function UniformsManager({ departmentId }: UniformsManagerProps) {
    const [uniforms, setUniforms] = useState<Uniform[]>([]);
    const [loading, setLoading] = useState(false);
    const [nombre, setNombre] = useState('');

    useEffect(() => {
        if (departmentId) fetchUniforms();
    }, [departmentId]);

    const fetchUniforms = async () => {
        if (!departmentId) return;

        const { data, error } = await supabase
            .from('uniformes_departamento' as any)
            .select('*')
            .eq('departamento_id', Number(departmentId))
            .order('nombre', { ascending: true });

        if (error) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } else {
            setUniforms((data as any) || []);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim() || !departmentId) return;

        setLoading(true);
        const { error } = await supabase
            .from('uniformes_departamento' as any)
            .insert({
                nombre: nombre.trim(),
                departamento_id: departmentId
            });

        if (error) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } else {
            notifications.show({ title: 'Éxito', message: 'Uniforme agregado', color: 'green' });
            setNombre('');
            fetchUniforms();
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        const { error } = await supabase
            .from('uniformes_departamento' as any)
            .delete()
            .eq('id', id);

        if (error) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } else {
            fetchUniforms();
        }
    };

    return (
        <Stack gap="md">
            <form onSubmit={handleSubmit}>
                <Group align="flex-end">
                    <TextInput
                        label="Nombre del Uniforme"
                        placeholder="Ej: Camisa Blanca con Corbata"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                        style={{ flex: 1 }}
                        leftSection={<IconShirt size={16} />}
                    />
                    <Button type="submit" loading={loading} leftSection={<IconPlus size={16} />}>
                        Agregar
                    </Button>
                </Group>
            </form>

            <Table highlightOnHover withTableBorder>
                <Table.Thead style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                    <Table.Tr>
                        <Table.Th>Nombre del Uniforme</Table.Th>
                        <Table.Th style={{ width: 80, textAlign: 'right' }}>Acciones</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {uniforms.length === 0 ? (
                        <Table.Tr>
                            <Table.Td colSpan={2}>
                                <Center py="xl">
                                    <Text c="dimmed" size="sm">No hay uniformes definidos para este departamento.</Text>
                                </Center>
                            </Table.Td>
                        </Table.Tr>
                    ) : (
                        uniforms.map((u) => (
                            <Table.Tr key={u.id}>
                                <Table.Td fw={500}>{u.nombre}</Table.Td>
                                <Table.Td>
                                    <Group justify="flex-end">
                                        <ActionIcon
                                            color="red"
                                            variant="light"
                                            onClick={() => handleDelete(u.id)}
                                            title="Eliminar Uniforme"
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))
                    )}
                </Table.Tbody>
            </Table>
        </Stack>
    );
}
