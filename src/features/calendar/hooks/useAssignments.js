import { useState, useEffect, useCallback } from 'react';
import { assignmentsService } from '../../../services/assignmentsService';
import { groupAssignmentsByDate, transformToCalendarEvents } from '../../../utils/calendar/dataTransformers';
import { notifications } from '@mantine/notifications';

/**
 * Hook para gestionar asignaciones de un departamento
 */
export function useAssignments(departmentId) {
  const [groupedAssignments, setGroupedAssignments] = useState({});
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    console.log('🎯 useAssignments - departmentId:', departmentId);
    
    if (!departmentId) {
      console.log('⚠️ No hay departmentId, limpiando datos');
      setGroupedAssignments({});
      setCalendarEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('📡 Fetching data para departamento:', departmentId);
      const data = await assignmentsService.fetchByDepartment(departmentId);
      console.log('✅ Datos recibidos:', data?.length || 0, 'asignaciones');
      console.log('[useAssignments] Asignaciones crudas:', data);
      // Transformar datos
      const grouped = groupAssignmentsByDate(data);
      const events = transformToCalendarEvents(data);
      
      console.log('📦 Grouped:', Object.keys(grouped).length, 'días');
      console.log('📦 Events:', events.length);
      
      setGroupedAssignments(grouped);
      setCalendarEvents(events);
    } catch (error) {
      console.error(error);
      notifications.show({ 
        title: 'Error', 
        message: 'Error cargando asignaciones', 
        color: 'red' 
      });
      setGroupedAssignments({});
      setCalendarEvents([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    groupedAssignments, 
    calendarEvents,
    loading, 
    refetch: fetchData 
  };
}
