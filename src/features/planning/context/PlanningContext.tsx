import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Position } from '../../../types';
import dayjs from 'dayjs';

// --- Types ---
export interface ServiceDateConfig {
    type: string;
    uniform: string;
    encargado_id: string | number | null;
    encargado_2_id: string | number | null;
    positionQuotas: Record<string, number>;
}

export interface HeaderState {
    id: number;
    estado: string | null;
}

export interface DraftAssignment {
    id: string;
    usuario_id: number | string;
    posicion_id: number | string;
    fecha: string;
    posicion?: Position;
    usuario?: { nombre: string; apellido: string };
    configuracion_dia_id?: number | string;
    aiMetadata?: {
        reasons: string[];
        usageInPlan: number;
    };
}

interface PlanningContextType {
    // State
    activeStep: number;
    selectedDeptId: string | null;
    selectedMonth: Date | null;
    selectedDates: string[];
    serviceConfigs: Record<string, ServiceDateConfig[]>;
    positions: Position[];
    headerState: HeaderState | null;
    previewAssignments: DraftAssignment[];
    loading: boolean;

    // Setters
    setActiveStep: React.Dispatch<React.SetStateAction<number>>;
    setSelectedDeptId: (id: string | null) => void;
    setSelectedMonth: (date: Date | null) => void;
    setSelectedDates: (dates: string[]) => void;
    setServiceConfigs: (configs: Record<string, ServiceDateConfig[]>) => void;
    setPositions: (positions: Position[]) => void;
    setHeaderState: (state: HeaderState | null) => void;
    setPreviewAssignments: React.Dispatch<React.SetStateAction<DraftAssignment[]>>;
    setLoading: (loading: boolean) => void;

    // Helpers
    handleDateChange: (dates: Date[] | string[] | Date | null) => void;
    addServiceToDate: (dateStr: string) => void;
    removeServiceFromDate: (dateStr: string, index: number) => void;
    updateServiceConfig: (dateStr: string, index: number, field: keyof ServiceDateConfig, value: string) => void;
    updatePositionQuota: (dateStr: string, index: number, posId: number | string, value: number) => void;
}

// --- Context ---
const PlanningContext = createContext<PlanningContextType | null>(null);

export function usePlanning() {
    const context = useContext(PlanningContext);
    if (!context) {
        throw new Error('usePlanning must be used within a PlanningProvider');
    }
    return context;
}

// --- Provider ---
export function PlanningProvider({ children }: { children: ReactNode }) {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [serviceConfigs, setServiceConfigs] = useState<Record<string, ServiceDateConfig[]>>({});
    const [positions, setPositions] = useState<Position[]>([]);
    const [headerState, setHeaderState] = useState<HeaderState | null>(null);
    const [previewAssignments, setPreviewAssignments] = useState<DraftAssignment[]>([]);
    const [loading, setLoading] = useState(false);

    // -- RESET LOGIC: Clear dependent state when base selection changes --
    const resetPlanningState = () => {
        setSelectedDates([]);
        setServiceConfigs({});
        setPreviewAssignments([]);
        setHeaderState(null);
    };

    const handleDeptChange = (id: string | null) => {
        if (id !== selectedDeptId) {
            setSelectedDeptId(id);
            resetPlanningState();
        }
    };

    const handleMonthChange = (date: Date | null) => {
        // Compare only month and year
        const currentM = selectedMonth ? dayjs(selectedMonth).format('YYYY-MM') : null;
        const newM = date ? dayjs(date).format('YYYY-MM') : null;
        
        if (newM !== currentM) {
            setSelectedMonth(date);
            resetPlanningState();
        }
    };

    // -- Logic Helper: Handle Date Selection & Sync Configs --
    const handleDateChange = (dates: Date[] | string[] | Date | null) => {
        const uniqueStrings = new Set<string>();

        const processDate = (d: Date | string) => {
            if (!d) return;
            if (typeof d === 'string') {
                uniqueStrings.add(d);
                return;
            }
            const djs = dayjs(d);
            const str = djs.hour(12).format('YYYY-MM-DD');
            uniqueStrings.add(str);
        };

        if (Array.isArray(dates)) {
            dates.forEach(processDate);
        } else if (dates) {
            processDate(dates as Date | string);
        }

        const sortedDates = Array.from(uniqueStrings).sort();
        setSelectedDates(sortedDates);

        // Sync configs
        const newConfigs = { ...serviceConfigs };
        sortedDates.forEach(dateStr => {
            if (!newConfigs[dateStr]) {
                const posQuotas: Record<string, number> = {};
                if (positions.length > 0) {
                    positions.forEach(p => posQuotas[p.id] = (Number(p.cantidad_default) || 1));
                }
                newConfigs[dateStr] = [{
                    type: 'Culto General',
                    uniform: '',
                    encargado_id: null,
                    encargado_2_id: null,
                    positionQuotas: posQuotas
                }];
            }
        });
        setServiceConfigs(newConfigs);
    };

    const addServiceToDate = (dateStr: string) => {
        setServiceConfigs(prev => {
            const list = prev[dateStr] ? [...prev[dateStr]] : [];
            const first = list[0];
            list.push({
                type: 'Culto Especial',
                uniform: first?.uniform || '',
                encargado_id: first?.encargado_id || null,
                encargado_2_id: first?.encargado_2_id || null,
                positionQuotas: { ...first?.positionQuotas }
            });
            return { ...prev, [dateStr]: list };
        });
    };

    const removeServiceFromDate = (dateStr: string, index: number) => {
        setServiceConfigs(prev => {
            const list = prev[dateStr] ? [...prev[dateStr]] : [];
            if (list.length > 1) {
                list.splice(index, 1);
            }
            return { ...prev, [dateStr]: list };
        });
    };

    const updateServiceConfig = (dateStr: string, index: number, field: keyof ServiceDateConfig, value: string) => {
        setServiceConfigs(prev => {
            const list = prev[dateStr] ? [...prev[dateStr]] : [];
            if (list[index]) {
                list[index] = { ...list[index], [field]: value };
            }
            return { ...prev, [dateStr]: list };
        });
    };

    const updatePositionQuota = (dateStr: string, index: number, posId: number | string, value: number) => {
        setServiceConfigs(prev => {
            const list = prev[dateStr] ? [...prev[dateStr]] : [];
            if (list[index]) {
                const newQuotas = { ...list[index].positionQuotas, [posId]: value };
                list[index] = { ...list[index], positionQuotas: newQuotas };
            }
            return { ...prev, [dateStr]: list };
        });
    };

    return (
        <PlanningContext.Provider value={{
            activeStep, setActiveStep,
            selectedDeptId, setSelectedDeptId: handleDeptChange,
            selectedMonth, setSelectedMonth: handleMonthChange,
            selectedDates, setSelectedDates,
            serviceConfigs, setServiceConfigs,
            positions, setPositions,
            headerState, setHeaderState,
            previewAssignments, setPreviewAssignments,
            loading, setLoading,
            handleDateChange,
            addServiceToDate,
            removeServiceFromDate,
            updateServiceConfig,
            updatePositionQuota
        }}>
            {children}
        </PlanningContext.Provider>
    );
}
