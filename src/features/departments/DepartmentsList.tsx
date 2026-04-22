import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
    Container,
    Title,
    Group,
    Stack,
    Button,
    Table,
    Text,
    Badge,
    Modal,
    TextInput,
    NumberInput,
    Paper,
    ThemeIcon,
    Center
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { 
    IconPlus, 
    IconEdit, 
    IconTrash, 
    IconSettings, 
    IconShirt, 
    IconBuildingCommunity,
    IconSearch
} from '@tabler/icons-react';
import { usePermissions } from '../../hooks/usePermissions';
import { PositionsManager } from './PositionsManager';
import { UniformsManager } from './UniformsManager';
import { TableSkeleton } from '../../components/TableSkeleton';

export interface Department {
    id: number;
    nombre: string;
    prioridad: number;
}

export default function DepartmentsList() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [opened, { open, close }] = useDisclosure(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState({ nombre: '', prioridad: 2 });
    const [searchQuery, setSearchQuery] = useState('');

    const [positionsModalOpen, setPositionsModalOpen] = useState(false);
    const [selectedDeptForPositions, setSelectedDeptForPositions] = useState<Department | null>(null);

    const [uniformsModalOpen, setUniformsModalOpen] = useState(false);
    const [selectedDeptForUniforms, setSelectedDeptForUniforms] = useState<Department | null>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

    const permissions = usePermissions();

    useEffect(() => {
        fetchDepartments();
    }, []);

    async function fetchDepartments() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('departamentos')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;
            setDepartments(data || []);
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } finally {
            setLoading(false);
        }
    }

    const filteredDepartments = departments.filter(d => 
        d.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (dept: Department) => {
        setEditingDept(dept);
        setFormData({ nombre: dept.nombre, prioridad: dept.prioridad });
        open();
    };

    const resetForm = () => {
        setEditingDept(null);
        setFormData({ nombre: '', prioridad: 2 });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingDept) {
                const { error } = await supabase
                    .from('departamentos')
                    .update(formData)
                    .eq('id', editingDept.id);
                if (error) throw error;
                notifications.show({ title: 'Éxito', message: 'Departamento actualizado', color: 'green' });
            } else {
                const { error } = await supabase
                    .from('departamentos')
                    .insert([formData]);
                if (error) throw error;
                notifications.show({ title: 'Éxito', message: 'Departamento creado', color: 'green' });
            }
            fetchDepartments();
            close();
            resetForm();
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (dept: Department) => {
        setDeptToDelete(dept);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deptToDelete) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('departamentos')
                .delete()
                .eq('id', deptToDelete.id);
            if (error) throw error;
            notifications.show({ title: 'Eliminado', message: 'Departamento eliminado correctamente', color: 'blue' });
            fetchDepartments();
            setDeleteModalOpen(false);
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    const handleManagePositions = (dept: Department) => {
        setSelectedDeptForPositions(dept);
        setPositionsModalOpen(true);
    };

    const closePositions = () => {
        setPositionsModalOpen(false);
        setSelectedDeptForPositions(null);
    };

    const handleManageUniforms = (dept: Department) => {
        setSelectedDeptForUniforms(dept);
        setUniformsModalOpen(true);
    };

    const closeUniforms = () => {
        setUniformsModalOpen(false);
        setSelectedDeptForUniforms(null);
    };

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Group justify="space-between" align="flex-end" wrap="wrap" gap="lg">
                    <Stack gap={0}>
                        <Title order={1} style={{ 
                            fontFamily: 'Inter, sans-serif', 
                            fontSize: '2.4rem',
                            letterSpacing: '-0.02em',
                            color: 'var(--mantine-color-text)'
                        }}>
                            Gestión de Departamentos 🏗️
                        </Title>
                        <Text c="dimmed" fw={500} size="md">Configuración de la estructura organizacional y uniformes</Text>
                    </Stack>

                    <Paper p="md" radius="lg" withBorder className="shell-glass" style={{
                        backgroundColor: 'var(--mantine-glass-bg, rgba(255, 255, 255, 0.7))',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        gap: '12px'
                    }}>
                        <TextInput 
                            placeholder="Buscar departamento..." 
                            size="md"
                            radius="md"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.currentTarget.value)}
                            leftSection={<IconSearch size={18} color="var(--mantine-color-gold-6)" />}
                        />
                        <Button 
                            onClick={() => { resetForm(); open(); }}
                            disabled={!permissions.canManageAllDepartments}
                            radius="md"
                            size="md"
                            className="btn-premium"
                            leftSection={<IconPlus size={18} />}
                        >
                            Nuevo Departamento
                        </Button>
                    </Paper>
                </Group>


                {loading ? (
                    <TableSkeleton rows={5} columns={4} />
                ) : (
                    <Paper shadow="md" radius="xl" withBorder className="glass-card" style={{
                        backgroundColor: 'var(--mantine-color-body)',
                        overflow: 'hidden'
                    }}>
                        <Table.ScrollContainer minWidth={600}>
                            <Table verticalSpacing="md" highlightOnHover>
                                <Table.Thead style={{ backgroundColor: 'var(--mantine-color-gray-1)', borderBottom: '2px solid var(--mantine-color-gray-3)' }}>
                                    <Table.Tr>
                                        <Table.Th style={{ color: 'var(--mantine-color-gray-7)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '24px' }}>ID</Table.Th>
                                        <Table.Th style={{ color: 'var(--mantine-color-gray-7)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nombre del Departamento</Table.Th>
                                        {permissions.isSystemAdmin && <Table.Th style={{ color: 'var(--mantine-color-gray-7)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Prioridad</Table.Th>}
                                        <Table.Th style={{ color: 'var(--mantine-color-gray-7)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right', paddingRight: '24px' }}>Acciones</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {filteredDepartments.length > 0 ? (
                                        filteredDepartments.map((dept) => (
                                            <Table.Tr key={dept.id}>
                                                <Table.Td style={{ paddingLeft: '24px' }}>
                                                    <Text fw={800} c="gold.6" size="sm">#{dept.id}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap="sm">
                                                        <ThemeIcon variant="light" color="gold" radius="md">
                                                            <IconBuildingCommunity size={16} />
                                                        </ThemeIcon>
                                                        <Text fw={700} size="md">{dept.nombre}</Text>
                                                    </Group>
                                                </Table.Td>
                                                {permissions.isSystemAdmin && (
                                                <Table.Td>
                                                    {Number(dept.prioridad) === 1 ? (
                                                        <Badge color="red" variant="filled" radius="sm" fw={800}>CRÍTICA (1)</Badge>
                                                    ) : (
                                                        <Badge color="gold" variant="light" radius="sm" fw={800} c="gold.9" style={{ border: '1px solid var(--mantine-color-gold-2)' }}>NORMAL (2)</Badge>
                                                    )}
                                                </Table.Td>
                                                )}
                                                <Table.Td style={{ paddingRight: '24px' }}>
                                                    <Group gap="xs" justify="flex-end">
                                                        <Button
                                                            variant="light"
                                                            color="blue"
                                                            size="xs"
                                                            radius="md"
                                                            leftSection={<IconSettings size={14} />}
                                                            onClick={() => handleManagePositions(dept)}
                                                            disabled={!permissions.canManagePositions(dept.id)}
                                                        >
                                                            Posiciones
                                                        </Button>
                                                        <Button
                                                            variant="light"
                                                            color="orange"
                                                            size="xs"
                                                            radius="md"
                                                            leftSection={<IconShirt size={14} />}
                                                            onClick={() => handleManageUniforms(dept)}
                                                            disabled={!permissions.canManageDepartment(dept.id)}
                                                        >
                                                            Uniformes
                                                        </Button>
                                                        {permissions.canManageAllDepartments && (
                                                            <>
                                                                <Button
                                                                    variant="light"
                                                                    color="blue"
                                                                    size="xs"
                                                                    radius="md"
                                                                    leftSection={<IconEdit size={14} />}
                                                                    onClick={() => handleEdit(dept)}
                                                                >
                                                                    Editar
                                                                </Button>
                                                                <Button
                                                                    variant="light"
                                                                    color="red"
                                                                    size="xs"
                                                                    radius="md"
                                                                    leftSection={<IconTrash size={14} />}
                                                                    onClick={() => openDeleteModal(dept)}
                                                                >
                                                                    Eliminar
                                                                </Button>
                                                            </>
                                                        )}
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))
                                    ) : (
                                        <Table.Tr>
                                            <Table.Td colSpan={4}>
                                                <Center py="xl">
                                                    <Text c="dimmed" fw={600}>No se encontraron departamentos</Text>
                                                </Center>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Paper>
                )}
            </Stack>

            {/* Modals */}
            <Modal opened={opened} onClose={close} title={editingDept ? "Editar Departamento" : "Nuevo Departamento"} radius="xl">
                <form onSubmit={handleSubmit}>
                    <Stack gap="md">
                        <TextInput
                            label="Nombre"
                            placeholder="Ej. Servidores AM"
                            required
                            radius="md"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        />
                        <NumberInput
                            label="Prioridad"
                            description="1 = Crítico (Bloquea choques), 2 = Normal"
                            min={1}
                            max={2}
                            radius="md"
                            value={formData.prioridad}
                            onChange={(val) => setFormData({ ...formData, prioridad: Number(val) })}
                        />
                        <Group justify="flex-end" mt="xl">
                            <Button variant="default" onClick={close} radius="md">Cancelar</Button>
                            <Button type="submit" loading={loading} radius="md" color="gold">Guardar</Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Modal opened={positionsModalOpen} onClose={closePositions} title={`Posiciones: ${selectedDeptForPositions?.nombre || ''}`} size="lg" radius="xl">
                <PositionsManager departmentId={selectedDeptForPositions?.id} />
            </Modal>

            <Modal opened={uniformsModalOpen} onClose={closeUniforms} title={`Uniformes: ${selectedDeptForUniforms?.nombre || ''}`} size="md" radius="xl">
                <UniformsManager departmentId={selectedDeptForUniforms?.id} />
            </Modal>

            <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar Eliminación" centered radius="xl">
                <Stack gap="md">
                    <Text size="sm">
                        ¿Estás seguro de que deseas eliminar el departamento <strong>{deptToDelete?.nombre}</strong>?
                        <br /><br />
                        <span style={{ color: 'red' }}>⚠️ Esta acción es irreversible y afectará a todos los miembros y roles asociados.</span>
                    </Text>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setDeleteModalOpen(false)} radius="md">Cancelar</Button>
                        <Button color="red" onClick={confirmDelete} loading={loading} radius="md">Eliminar</Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}
