import { notifications } from '@mantine/notifications';
import { 
    IconCheck, 
    IconX, 
    IconInfoCircle, 
    IconAlertTriangle,
    IconBell
} from '@tabler/icons-react';

/**
 * Helper para mostrar notificaciones premium con consistencia en toda la app.
 */
export const notify = {
    success: (message: string, title: string = '¡Éxito!') => {
        notifications.show({
            title,
            message,
            color: 'green',
            icon: <IconCheck size={18} />,
            radius: 'md',
            withCloseButton: true,
            style: { borderLeft: '4px solid var(--mantine-color-green-6)' },
        });
    },

    error: (message: string, title: string = 'Ha ocurrido un error') => {
        notifications.show({
            title,
            message,
            color: 'red',
            icon: <IconX size={18} />,
            radius: 'md',
            withCloseButton: true,
            style: { borderLeft: '4px solid var(--mantine-color-red-6)' },
        });
    },

    info: (message: string, title: string = 'Información') => {
        notifications.show({
            title,
            message,
            color: 'blue',
            icon: <IconInfoCircle size={18} />,
            radius: 'md',
            withCloseButton: true,
            style: { borderLeft: '4px solid var(--mantine-color-blue-6)' },
        });
    },

    warning: (message: string, title: string = 'Atención') => {
        notifications.show({
            title,
            message,
            color: 'orange',
            icon: <IconAlertTriangle size={18} />,
            radius: 'md',
            withCloseButton: true,
            style: { borderLeft: '4px solid var(--mantine-color-orange-6)' },
        });
    },

    premium: (message: string, title: string = 'Notificación') => {
        notifications.show({
            title,
            message,
            color: 'gold',
            icon: <IconBell size={18} />,
            radius: 'md',
            withCloseButton: true,
            style: { 
                borderLeft: '4px solid var(--mantine-color-gold-6)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)'
            },
        });
    }
};
