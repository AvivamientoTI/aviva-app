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
                message: 'Tu contraseña fue actualizada correctamente.',
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

    const confirmMismatch = confirmPassword.length > 0 && password !== confirmPassword;

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
            radius="lg"
        >
            <Stack
                gap="md"
                component="form"
                onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }}
            >
                <PasswordInput
                    label="Nueva contraseña"
                    placeholder="Mínimo 8 caracteres, mayúscula, número y símbolo"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    leftSection={<IconLock size={16} />}
                />

                <PasswordInput
                    label="Confirmar contraseña"
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    error={confirmMismatch ? 'Las contraseñas no coinciden' : undefined}
                    leftSection={<IconShieldCheck size={16} />}
                />

                <Group justify="flex-end" mt="xs">
                    <Button variant="light" color="stone" onClick={onClose} disabled={loading} type="button">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        loading={loading}
                        className="btn-premium"
                    >
                        Actualizar contraseña
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
