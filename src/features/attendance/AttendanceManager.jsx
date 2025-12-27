// Guardar asistencia
async function handleSave() {
    if (!selectedService || members.length === 0) {
        notifications.show({
            title: 'Error',
            message: 'No hay datos suficientes para guardar la asistencia.',
            color: 'red',
            icon: <IconAlertCircle size={18} />
        });
        return;
    }
    setSaving(true);
    try {
        // Construir registros a guardar
        const records = members.map(member => ({
            usuario_id: member.id,
            config_dia_id: selectedService,
            estado: attendance[member.id]?.estado || '',
            justificacion: attendance[member.id]?.justificacion || ''
        }));
        const { error } = await attendanceService.saveAttendance(records);
        if (error) throw error;
        notifications.show({
            title: '¡Éxito!',
            message: 'Asistencia guardada correctamente.',
            color: 'green',
            icon: <IconCheck size={18} />
        });
    } catch (error) {
        console.error(error);
        notifications.show({
            title: 'Error al guardar',
            message: error.message || 'No se pudo guardar la asistencia.',
            color: 'red',
            icon: <IconAlertCircle size={18} />
        });
    } finally {
        setSaving(false);
    }
}
import React, { useState, useEffect, useMemo } from 'react';
import {
    Container,
    Paper,
    Title,
    Text,
    Select,
    Table,
    Group,
    Stack,
    Button,
    SegmentedControl,
    TextInput,
    Badge,
    Loader,
    Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconDeviceFloppy, IconHistory } from '@tabler/icons-react';
import { useUser } from '../../contexts/UserContext';

import { attendanceService } from '../../services/attendanceService';
import dayjs from 'dayjs';

export function AttendanceManager() {
    const { attendanceManagedDepartments, userMemberships } = useUser();
    const [selectedDept, setSelectedDept] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [serviceDays, setServiceDays] = useState([]);
    const [members, setMembers] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);


    // Declarar servidoresDept y servidoresMembership antes de los hooks
    const servidoresDept = attendanceManagedDepartments?.find(d => d.nombre?.toLowerCase() === 'servidores');
    const servidoresMembership = userMemberships?.find(m => {
        const nombreDept = m.departamento?.nombre?.toLowerCase() || '';
        const rol = m.rol_jerarquico?.toLowerCase() || '';
        return nombreDept === 'servidores' && (
            rol === 'líder' || rol === 'lider' || rol === 'sublíder' || rol === 'sublider' || rol === 'encargado' || rol === 'encargada'
        );
    });

    // Todos los hooks deben ir antes de cualquier return condicional
    useEffect(() => {
        if (!selectedDept && attendanceManagedDepartments && attendanceManagedDepartments.length > 0) {
            setSelectedDept(String(attendanceManagedDepartments[0].id));
        }
    }, [attendanceManagedDepartments, selectedDept]);

    useEffect(() => {
        if (servidoresDept && selectedDept !== String(servidoresDept.id)) {
            setSelectedDept(String(servidoresDept.id));
        }
    }, [servidoresDept, selectedDept]);

    useEffect(() => {
        if (selectedDept) {
            fetchData();
        }
    }, [selectedDept]);

    useEffect(() => {
        if (selectedService) {
            fetchAttendanceData();
        } else {
            setAttendance({});
        }
    }, [selectedService]);

    // Solo después de los hooks, los returns condicionales
    if (!attendanceManagedDepartments) {
        return (
            <Container size="md" py="xl">
                <Loader size="lg" />
                <Text>Inicializando...</Text>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container size="md" py="xl">
                <Loader size="lg" />
                <Text>Cargando datos de usuario...</Text>
            </Container>
        );
    }

    // Filtrar departamentos: solo mostrar 'Servidores' si el usuario tiene el rol adecuado

    // Si no tiene acceso, ocultar la vista
    if (!servidoresDept || !servidoresMembership) {
        return null;
    }

    // Solo permitir seleccionar el departamento 'Servidores'
    const deptOptions = [{ value: String(servidoresDept.id), label: servidoresDept.nombre }];

    // Definir fetchData y fetchAttendanceData
    function handleAttendanceChange(userId, field, value) {
        setAttendance(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [field]: value
            }
        }));
    }

    async function fetchData() {

        setLoading(true);
        try {
            const [days, deptMembers] = await Promise.all([
                attendanceService.fetchServiceDays(selectedDept),
                attendanceService.fetchDeptMembers(selectedDept)
            ]);
            setServiceDays(days);
            setMembers(deptMembers);
            if (days.length > 0) {
                setSelectedService(days[0].id);
            } else {
                setSelectedService(null);
            }
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error de Datos',
                message: 'No se pudo sincronizar la lista de miembros o servicios.',
                color: 'red',
                icon: <IconAlertCircle size={18} />
            });
        } finally {
            setLoading(false);
        }
    }

    async function fetchAttendanceData() {
        try {
            const data = await attendanceService.fetchAttendance(selectedService);
            const attendanceMap = {};
            data.forEach(rec => {
                attendanceMap[rec.usuario_id] = {
                    estado: rec.estado,
                    justificacion: rec.justificacion || ''
                };
            });
            setAttendance(attendanceMap);
        } catch (error) {
            console.error(error);
        }
    }

    const serviceOptions = serviceDays.map(d => ({
        value: String(d.id),
        label: `${dayjs(d.fecha).format('DD/MM')} - ${d.tipo_servicio}`
    }));


    // ...existing code...
    return (
        <Container size="xl" py="xl">
            <Paper shadow="sm" p="xl" radius="md" withBorder>
                <Stack gap="lg">
                    <Group justify="space-between" align="flex-start">
                        <div>
                            <Title order={2}>Control de Asistencia</Title>
                            <Text c="dimmed">Registra la asistencia de todos los miembros del equipo.</Text>
                        </div>
                        <Group align="flex-end">
                            <Select
                                label="Departamento"
                                data={deptOptions}
                                value={selectedDept}
                                onChange={setSelectedDept}
                            />
                            <Select
                                label="Servicio / Fecha"
                                placeholder="Selecciona un servicio"
                                data={serviceOptions}
                                value={selectedService}
                                onChange={setSelectedService}
                                w={250}
                            />
                        </Group>
                    </Group>

                    {loading ? (
                        <Stack align="center" py="xl">
                            <Loader size="lg" />
                            <Text>Cargando miembros...</Text>
                        </Stack>
                    ) : selectedService ? (
                        <>
                            <Table.ScrollContainer minWidth={800}>
                                <Table verticalSpacing="sm">
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Servidor</Table.Th>

                                            <Table.Th>Estado de Asistencia</Table.Th>
                                            <Table.Th>Justificación / Notas</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {members.map((member) => (
                                            <Table.Tr key={member.id}>
                                                <Table.Td>
                                                    <Text fw={500}>{member.nombre} {member.apellido}</Text>
                                                </Table.Td>

                                                <Table.Td>
                                                    <SegmentedControl
                                                        size="xs"
                                                        value={attendance[member.id]?.estado || ''}
                                                        onChange={(val) => handleAttendanceChange(member.id, 'estado', val)}
                                                        data={[
                                                            { label: 'Asistió', value: 'Asistió' },
                                                            { label: 'Faltó c/ Aviso', value: 'Faltó con Aviso' },
                                                            { label: 'Faltó s/ Aviso', value: 'Faltó sin Aviso' },
                                                        ]}
                                                        color={
                                                            attendance[member.id]?.estado === 'Asistió' ? 'green' :
                                                                attendance[member.id]?.estado === 'Faltó con Aviso' ? 'orange' :
                                                                    attendance[member.id]?.estado === 'Faltó sin Aviso' ? 'red' : 'gray'
                                                        }
                                                    />
                                                </Table.Td>
                                                <Table.Td>
                                                    <TextInput
                                                        placeholder="Ej: Enfermedad, viaje..."
                                                        size="xs"
                                                        value={attendance[member.id]?.justificacion || ''}
                                                        onChange={(e) => handleAttendanceChange(member.id, 'justificacion', e.target.value)}
                                                        disabled={attendance[member.id]?.estado === 'Asistió'}
                                                    />
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Table.ScrollContainer>

                            <Group justify="flex-end">
                                <Button
                                    leftSection={<IconDeviceFloppy size={20} />}
                                    onClick={handleSave}
                                    loading={saving}
                                    size="md"
                                    color="blue"
                                >
                                    Guardar Asistencia
                                </Button>
                            </Group>
                        </>
                    ) : (
                        <Alert icon={<IconAlertCircle size={16} />} title="Sin Servicios" color="yellow">
                            No se encontraron días de servicio configurados para este departamento en el mes actual o pasado.
                            Por favor, asegúrate de que el rol haya sido planificado.
                        </Alert>
                    )}
                </Stack>
            </Paper>
        </Container>
    );
}
