import React, { useState, useEffect } from 'react';
import { Table, Button, Group, TextInput, NumberInput, Select, ActionIcon, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { supabase } from '../../services/supabaseClient';

export function PositionsManager({ departmentId }) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    cantidad_default: 1,
    genero_requerido: 'A'
  });

  useEffect(() => {
    if (departmentId) fetchPositions();
  }, [departmentId]);

  const fetchPositions = async () => {
    const { data, error } = await supabase
      .from('posiciones_departamento')
      .select('*')
      .eq('departamento_id', departmentId)
      .order('nombre');
    
    if (error) {
      notifications.show({ title: 'Error', message: error.message, color: 'red' });
    } else {
      setPositions(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

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
      setFormData({ nombre: '', cantidad_default: 1, genero_requerido: 'A' });
      fetchPositions();
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
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
            value={formData.cantidad_default}
            onChange={(val) => setFormData({ ...formData, cantidad_default: val })}
            min={1}
            style={{ flex: 1 }}
          />
          <Select
            label="Género"
            value={formData.genero_requerido}
            onChange={(val) => setFormData({ ...formData, genero_requerido: val })}
            data={[
              { value: 'A', label: 'Cualquiera' },
              { value: 'M', label: 'Hombres' },
              { value: 'F', label: 'Mujeres' }
            ]}
            style={{ flex: 1 }}
          />
          <Button type="submit" loading={loading}>Agregar</Button>
        </Group>
      </form>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Cantidad Default</Table.Th>
            <Table.Th>Género</Table.Th>
            <Table.Th>Acciones</Table.Th>
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
                <Table.Td>{pos.cantidad_default}</Table.Td>
                <Table.Td>
                  {pos.genero_requerido === 'M' ? 'Hombres' : 
                   pos.genero_requerido === 'F' ? 'Mujeres' : 'Cualquiera'}
                </Table.Td>
                <Table.Td>
                  <ActionIcon color="red" onClick={() => handleDelete(pos.id)}>
                    X
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}
