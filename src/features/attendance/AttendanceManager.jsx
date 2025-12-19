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
    const { attendanceManagedDepartments, userProfile } = useUser();
    const [selectedDept, setSelectedDept] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [serviceDays, setServiceDays] = useState([]);
    const [members, setMembers] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initialize selected department
    useEffect(() => {
        if (attendanceManagedDepartments.length > 0 && !selectedDept) {
            setSelectedDept(String(attendanceManagedDepartments[0].id));
        }
    }, [attendanceManagedDepartments]);

    // Fetch service days when department changes
    useEffect(() => {
        if (selectedDept) {
            fetchData();
        }
    }, [selectedDept]);

    // Fetch attendance when service day changes
    useEffect(() => {
        if (selectedService) {
            fetchAttendanceData();
        } else {
            setAttendance({});
        }
    }, [selectedService]);

    const fetchData = async () => {
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
    };

    const fetchAttendanceData = async () => {
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
    };

    const handleAttendanceChange = (userId, field, value) => {
        setAttendance(prev => ({
            ...prev,
            [userId]: {
                ...(prev[userId] || { estado: 'Asistió', justificacion: '' }),
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        if (!selectedService) return;
        setSaving(true);
        try {
            const records = Object.entries(attendance).map(([userId, data]) => ({
                configuracion_dia_id: selectedService,
                usuario_id: userId,
                estado: data.estado,
                justificacion: data.justificacion,
                registrado_por: userProfile?.usuario_id
            }));

            await attendanceService.saveAttendance(records);
            notifications.show({ title: 'Éxito', message: 'Asistencia guardada correctamente', color: 'green', icon: <IconCheck size={16} /> });
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Error', message: 'No se pudo guardar la asistencia', color: 'red' });
        } finally {
            setSaving(false);
        }
    };

    const deptOptions = attendanceManagedDepartments.map(d => ({ value: String(d.id), label: d.nombre }));
    const serviceOptions = serviceDays.map(d => ({
        value: String(d.id),
        label: `${dayjs(d.fecha).format('DD/MM')} - ${d.tipo_servicio}`
    }));

    if (attendanceManagedDepartments.length === 0) {
        return (
            <Container size="md" py="xl">
                <Alert icon={<IconAlertCircle size={16} />} title="Acceso Denegado" color="red">
                    No tienes permisos para gestionar la asistencia de ningún departamento.
                </Alert>
            </Container>
        );
    }

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
                                            <Table.Th>Rol</Table.Th>
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
                                                    <Badge variant="light" size="sm">{member.rol}</Badge>
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
