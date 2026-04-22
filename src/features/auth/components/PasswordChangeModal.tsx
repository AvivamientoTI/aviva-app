import { useState } from 'react';
import { Modal, Button, PasswordInput, Stack, Text, Group } from '@mantine/core';
import { IconLock, IconShieldCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../../../services/supabaseClient';

interface PasswordChangeModalProps {
    opened: boolean;
    onClose: () => void;
}

export function PasswordChangeModal({ opened, onClose }: PasswordChangeModalProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async () => {
        if (!password || !confirmPassword) {
            notifications.show({
                title: 'Campos requeridos',
                message: 'Por favor, completa ambos campos de contraseña.',
                color: 'orange'
            });
            return;
        }

        if (password !== confirmPassword) {
            notifications.show({
                title: 'Error de validación',
                message: 'Las contraseñas no coinciden.',
                color: 'red'
            });
            return;
        }

        const pwdErrors: string[] = [];
        if (password.length < 8) pwdErrors.push('mínimo 8 caracteres');
        if (!/[A-Z]/.test(password)) pwdErrors.push('al menos una mayúscula');
        if (!/[0-9]/.test(password)) pwdErrors.push('al menos un número');
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) pwdErrors.push('al menos un símbolo');

        if (pwdErrors.length > 0) {
            notifications.show({
                title: 'Contraseña débil',
                message: `La contraseña requiere: ${pwdErrors.join(', ')}.`,
                color: 'orange'
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            notifications.show({
                title: 'Contraseña actualizada',
                message: 'Tu contraseña ha sido cambiada exitosamente.',
                color: 'green',
                icon: <IconShieldCheck size={18} />
            });
            onClose();
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            notifications.show({
                title: 'Error al cambiar contraseña',
                message: error.message || 'Ocurrió un error inesperado.',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconLock size={20} color="var(--mantine-color-orange-filled)" />
                    <Text fw={700}>Cambiar Contraseña</Text>
                </Group>
            }
            radius="md"
        >
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Ingresa tu nueva contraseña a continuación. Te recomendamos usar una combinación de letras, números y símbolos.
                </Text>

                <PasswordInput
                    label="Nueva Contraseña"
                    placeholder="Tu nueva contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    leftSection={<IconLock size={16} />}
                />

                <PasswordInput
                    label="Confirmar Contraseña"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    leftSection={<IconShieldCheck size={16} />}
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="light" color="gray" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button 
                        color="orange.7" 
                        onClick={handlePasswordChange} 
                        loading={loading}
                        variant="gradient"
                        gradient={{ from: 'orange.6', to: 'yellow.6', deg: 135 }}
                    >
                        Actualizar Contraseña
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
