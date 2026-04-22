import { useState, useEffect } from 'react';
import {
    Modal,
    Stack,
    Text,
    Button,
    Group,
    Avatar,
    Badge,
    ThemeIcon,
    LoadingOverlay,
    Alert
} from '@mantine/core';
import { IconRobot, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { recommendationService, type ScoredCandidate } from '../../../services/recommendationService';
import dayjs from 'dayjs';

interface SubstituteRecommendationModalProps {
    opened: boolean;
    onClose: () => void;
    currentAssignment: {
        date: string;
        positionId: number;
        positionName: string;
        departmentId: number;
        userToReplaceId?: number;
    };
    onSelectSubstitute: (userId: number) => Promise<void>;
}

export const SubstituteRecommendationModal = ({
    opened,
    onClose,
    currentAssignment,
    onSelectSubstitute
}: SubstituteRecommendationModalProps) => {
    const [loading, setLoading] = useState(true);
    const [candidates, setCandidates] = useState<ScoredCandidate[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectingId, setSelectingId] = useState<number | null>(null);

    useEffect(() => {
        if (opened) {
            fetchRecommendations();
        }
    }, [opened, currentAssignment]);

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);
        try {
            const isLeaderPos = currentAssignment.positionName.toLowerCase().includes('encargado') ||
                currentAssignment.positionName.toLowerCase().includes('lider');

            // Assume gender 'M' for now if position implies men (e.g. Portero often men in some churches, 
            // but let's default to null unless we have position metadata availability).
            //Ideally we should fetch position metadata here, but for MVP we'll be gender neutral unless rigid.

            const results = await recommendationService.getRecommendations(
                currentAssignment.date,
                currentAssignment.departmentId,
                { positionRequiresGender: null, positionRequiresLeadership: isLeaderPos }
            );

            setCandidates(results);
        } catch (err) {
            console.error('AI Error:', err);
            setError('No se pudieron generar recomendaciones. Intenta manualmente.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (userId: number) => {
        setSelectingId(userId);
        try {
            await onSelectSubstitute(userId);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSelectingId(null);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <ThemeIcon color="grape" variant="light" size="lg">
                        <IconRobot size={20} />
                    </ThemeIcon>
                    <Text fw={700}>Smart Substitute AI</Text>
                </Group>
            }
            size="lg"
            radius="md"
        >
            <Stack gap="md" py="xs">
                <Alert color="blue" icon={<IconRobot size={16} />} title="Sugerencias Inteligentes" variant="light">
                    He analizado la disponibilidad y rotación para encontrar los mejores reemplazos para el
                    <Text span fw={700}> {dayjs(currentAssignment.date).format('DD [de] MMMM')}</Text>.
                </Alert>

                <div style={{ position: 'relative', minHeight: 200 }}>
                    <LoadingOverlay visible={loading} />

                    {error && <Text c="red" size="sm">{error}</Text>}

                    {!loading && candidates.length === 0 && (
                        <Stack align="center" py="xl" c="dimmed">
                            <IconAlertCircle size={32} />
                            <Text>No encontré candidatos óptimos disponibles.</Text>
                        </Stack>
                    )}

                    <Stack gap="sm">
                        {candidates.map((candidate) => (
                            <Group
                                key={candidate.id}
                                justify="space-between"
                                p="sm"
                                style={{
                                    border: '1px solid var(--mantine-color-default-border)',
                                    borderRadius: 'var(--mantine-radius-md)',
                                    backgroundColor: selectingId === candidate.id ? 'var(--mantine-color-blue-0)' : undefined
                                }}
                            >
                                <Group gap="sm">
                                    <Avatar color="blue" radius="xl">
                                        {candidate.nombre[0]}{candidate.apellido[0]}
                                    </Avatar>
                                    <div>
                                        <Group gap="xs">
                                            <Text fw={600}>{candidate.apellido}, {candidate.nombre}</Text>
                                            <Badge
                                                color={candidate.score > 80 ? 'green' : candidate.score > 50 ? 'yellow' : 'gray'}
                                                size="sm"
                                                variant="light"
                                            >
                                                {candidate.score}% Match
                                            </Badge>
                                        </Group>
                                        <Text size="xs" c="dimmed">
                                            {candidate.matchReasons.join(' • ')}
                                        </Text>
                                    </div>
                                </Group>

                                <Button
                                    size="xs"
                                    variant="light"
                                    color="blue"
                                    onClick={() => handleSelect(candidate.id)}
                                    loading={selectingId === candidate.id}
                                    leftSection={<IconCheck size={14} />}
                                >
                                    Asignar
                                </Button>
                            </Group>
                        ))}
                    </Stack>
                </div>
            </Stack>
        </Modal>
    );
};
