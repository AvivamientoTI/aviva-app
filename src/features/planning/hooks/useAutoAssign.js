import { useState } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { getUsersNotAssignedOnDate } from '../../../utils/exclusionLogic';

export const useAutoAssign = (selectedDept, deptMeta) => {
    const [loading, setLoading] = useState(false);

    const generateAssignments = async (savedConfigs, serviceConfigs, positions) => {
        setLoading(true);
        try {
            // 1. Fetch department users
            const { data: deptMemberships } = await supabase
                .from('membresias')
                .select('usuario_id, rol_jerarquico, usuario:usuarios(*)')
                .eq('departamento_id', selectedDept);

            if (!deptMemberships || deptMemberships.length === 0) {
                console.warn("No memberships found for dept:", selectedDept);
                return [];
            }

            const userIds = deptMemberships.map(m => m.usuario_id);

            // 2. Fetch ALL memberships for these users to find external leadership roles
            const { data: allMemberships } = await supabase
                .from('membresias')
                .select('usuario_id, departamento_id, rol_jerarquico')
                .in('usuario_id', userIds);

            const normalize = (str) => str?.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';

            // 3. Process users and identify external leaders
            const usersMap = {};
            deptMemberships.forEach(m => {
                const uid = m.usuario.id;
                if (!usersMap[uid]) {
                    usersMap[uid] = {
                        ...m.usuario,
                        roles: [],
                        isExternalLeader: false
                    };
                }
                usersMap[uid].roles.push(normalize(m.rol_jerarquico));
            });

            // Flag users who are leaders/subleaders in other departments
            allMemberships.forEach(m => {
                const uid = m.usuario_id;
                if (usersMap[uid] && Number(m.departamento_id) !== Number(selectedDept)) {
                    const role = normalize(m.rol_jerarquico);
                    if (['lider', 'sublider'].includes(role)) {
                        usersMap[uid].isExternalLeader = true;
                    }
                }
            });

            const deptUsers = Object.values(usersMap);

            // ... (rest of the fetching logic remains same)
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            const { data: recentAssignments } = await supabase
                .from('asignaciones')
                .select('usuario_id, configuracion_dia(fecha)')
                .gte('configuracion_dia.fecha', lastMonth.toISOString().slice(0, 10));

            const recentCount = {};
            const userDates = {};
            if (recentAssignments) {
                recentAssignments.forEach(a => {
                    recentCount[a.usuario_id] = (recentCount[a.usuario_id] || 0) + 1;
                    if (!userDates[a.usuario_id]) userDates[a.usuario_id] = [];
                    if (a.configuracion_dia && a.configuracion_dia.fecha) {
                        userDates[a.usuario_id].push(a.configuracion_dia.fecha);
                    }
                });
            }

            const assignments = [];
            const configsSorted = [...savedConfigs].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            const diagnostics = {
                deptUsersFound: deptUsers.length,
                datesProcessed: 0,
                details: []
            };

            for (let i = 0; i < configsSorted.length; i++) {
                const config = configsSorted[i];
                diagnostics.datesProcessed++;
                const dateStr = config.fecha;
                const serviceConfig = serviceConfigs[dateStr];
                if (!serviceConfig) continue;

                const eligibleUsers = await getUsersNotAssignedOnDate(config.fecha, deptUsers);

                let prevDate = null;
                if (i > 0) prevDate = configsSorted[i - 1].fecha;

                for (const pos of positions) {
                    const quota = serviceConfig.positionQuotas[pos.id] || 0;
                    const isEncargadoPos = pos.nombre.toLowerCase().includes('encargado');
                    const logEntry = { date: dateStr, position: pos.nombre, quota, eligible: eligibleUsers.length, assigned: 0 };

                    if (quota <= 0) {
                        logEntry.status = 'Skipped: Quota 0';
                        diagnostics.details.push(logEntry);
                        continue;
                    }

                    let candidates = eligibleUsers.filter(u => {
                        // Already assigned today
                        if (assignments.some(a => a.configuracion_dia_id === config.id && a.usuario_id === u.id)) return false;

                        // Gender check
                        if (pos.genero_requerido === 'M' && u.genero !== 'M') return false;
                        if (pos.genero_requerido === 'F' && u.genero !== 'F') return false;

                        // ENCARGADO LOGIC: Only users with one of these roles in their 'roles' array
                        if (isEncargadoPos) {
                            return u.roles.some(r => ['lider', 'sublider', 'encargado'].includes(r));
                        }

                        return true;
                    });

                    logEntry.candidatesAfterGenderAndDupes = candidates.length;

                    // Preferencia: excluir quienes sirvieron el día anterior (si hay suficientes)
                    let prevDayAssigned = [];
                    if (prevDate) {
                        prevDayAssigned = assignments
                            .filter(a => a.configuracion_dia_id === configsSorted[i - 1].id)
                            .map(a => a.usuario_id);
                    }
                    // Candidatos que NO sirvieron el día anterior
                    let nonConsecutive = candidates.filter(u => !prevDayAssigned.includes(u.id));
                    // Si hay suficientes para la cuota, usar solo estos
                    if (nonConsecutive.length >= quota) {
                        candidates = nonConsecutive;
                    }
                    // Si no, se permite que repitan, pero se prioriza a los que no repiten

                    // 1. Prioridad: servidores que NO son líderes/sublíderes en otros deptos.
                    // 2. Prioridad: servidores con menos asignaciones en el último mes.
                    // 3. Aleatorio para desempates.
                    candidates.sort((a, b) => {
                        // Priorizar no-líderes externos (false < true)
                        if (a.isExternalLeader !== b.isExternalLeader) {
                            return a.isExternalLeader ? 1 : -1;
                        }

                        // Priorizar menos asignaciones recientes
                        const countA = recentCount[a.id] || 0;
                        const countB = recentCount[b.id] || 0;
                        if (countA !== countB) return countA - countB;

                        // Aleatorio
                        return 0.5 - Math.random();
                    });

                    const selected = candidates.slice(0, quota);
                    logEntry.assigned = selected.length;

                    if (selected.length < quota) {
                        logEntry.status = 'Partial/None: Not enough candidates';
                    } else {
                        logEntry.status = 'Success';
                    }
                    diagnostics.details.push(logEntry);

                    selected.forEach(user => {
                        assignments.push({
                            configuracion_dia_id: config.id,
                            usuario_id: user.id,
                            usuario: user, // Include the full user object
                            posicion_id: pos.id
                        });
                        // Actualizar conteo y fechas para próximas iteraciones
                        recentCount[user.id] = (recentCount[user.id] || 0) + 1;
                        if (!userDates[user.id]) userDates[user.id] = [];
                        userDates[user.id].push(dateStr);
                    });
                }
            }

            return { assignments, diagnostics };
        } catch (error) {
            console.error('Error generating assignments:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { generateAssignments, loading };
};
