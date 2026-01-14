import { useState } from 'react';
import {
    Paper,
    TextInput,
    ActionIcon,
    Text,
    Group,
    Stack,
    ThemeIcon,
    Loader,
    Box,
    Collapse,
    Badge
} from '@mantine/core';
import {
    IconSend,
    IconSparkles,
    IconX,
    IconTrophy,
    IconCalendarEvent,
    IconAlertCircle,
    IconMessageChatbot
} from '@tabler/icons-react';
import { BarChart, DonutChart } from '@mantine/charts';
import { conversationalService, type AiResponse } from '../../../services/conversationalService';

interface AiQueryWidgetProps {
    departmentId: number;
}

export const AiQueryWidget = ({ departmentId }: AiQueryWidgetProps) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<AiResponse | null>(null);
    const [expanded, setExpanded] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setExpanded(true);
        setResponse(null);
        try {
            // Artificial delay for "Thinking" effect
            await new Promise(r => setTimeout(r, 600));

            const result = await conversationalService.processQuery(query, departmentId);
            setResponse(result);
        } catch (error) {
            console.error(error);
            setResponse({
                type: 'text',
                message: 'Tuve un error procesando tu consulta. Intenta de nuevo.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const renderThinking = () => (
        <Group gap="xs" c="dimmed" p="sm">
            <Loader size="xs" color="grape" type="dots" />
            <Text size="sm" fs="italic">Analizando datos...</Text>
        </Group>
    );

    const renderContent = () => {
        if (!response) return null;

        return (
            <Stack gap="md" p="md" className="animate-fade-in">
                <Group gap="xs" align="flex-start">
                    <ThemeIcon variant="light" color="grape" size="md" radius="xl" mt={2}>
                        <IconSparkles size={14} />
                    </ThemeIcon>
                    <Text size="sm" style={{ flex: 1 }}>{response.message}</Text>
                </Group>

                {response.type === 'chart' && response.chartData && (
                    <Box h={200} w="100%">
                        {response.chartType === 'bar' ? (
                            <BarChart
                                h={200}
                                data={response.chartData}
                                dataKey="name"
                                series={[{ name: 'value', color: 'blue.6' }]}
                                gridAxis="xy"
                            />
                        ) : (
                            <DonutChart
                                h={200}
                                data={response.chartData}
                                withLabelsLine
                                withLabels
                                paddingAngle={2}
                            />
                        )}
                    </Box>
                )}

                {response.type === 'list' && response.data && (
                    <Stack gap="xs">
                        {response.data.map((item: any, i: number) => (
                            <Paper key={i} withBorder p="xs" radius="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                                <Group>
                                    <ThemeIcon
                                        color={item.icon === 'alert' ? 'red' : 'blue'}
                                        variant="light"
                                        size="sm"
                                    >
                                        {item.icon === 'alert' ? <IconAlertCircle size={12} /> :
                                            item.icon === 'calendar' ? <IconCalendarEvent size={12} /> :
                                                <IconTrophy size={12} />}
                                    </ThemeIcon>
                                    <div style={{ flex: 1 }}>
                                        <Text size="sm" fw={600}>{item.title}</Text>
                                        <Text size="xs" c="dimmed">{item.desc}</Text>
                                    </div>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Stack>
        );
    };

    const suggestionChips = [
        { label: '📊 Asistencia', query: 'resumen asistencia' },
        { label: '🏆 Top Servidores', query: 'top servidores' },
        { label: '📅 Próx. Eventos', query: 'proximos servicios' },
        { label: '⚠️ Faltas', query: 'quien falta mucho' },
    ];

    return (
        <Paper
            radius="lg"
            withBorder
            style={{
                overflow: 'hidden',
                border: '1px solid var(--mantine-color-grape-2)',
                background: 'linear-gradient(to bottom right, #fff, var(--mantine-color-grape-0))'
            }}
            mb="xl"
            shadow={expanded ? 'md' : 'sm'}
            className="animate-fade-in"
        >
            <Stack gap={0}>
                {/* Header / Input Area */}
                <Box p="md">
                    <Group gap="sm" mb="xs">
                        <ThemeIcon
                            size="lg"
                            variant="gradient"
                            gradient={{ from: 'grape', to: 'indigo' }}
                            radius="xl"
                        >
                            <IconMessageChatbot size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="sm" fw={700} c="grape.9" lh={1.2}>Asistente de Inteligencia</Text>
                            <Text size="xs" c="grape.6">Pregúntame sobre datos de tu equipo</Text>
                        </div>
                    </Group>

                    <TextInput
                        placeholder="Ej: 'Resumen de asistencia' o '¿Quién es el top servidor?'"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        size="md"
                        radius="md"
                        rightSection={
                            <ActionIcon
                                size="sm"
                                variant="filled"
                                color="grape"
                                onClick={handleSearch}
                                loading={loading}
                            >
                                <IconSend size={14} />
                            </ActionIcon>
                        }
                    />

                    {!expanded && (
                        <Group gap="xs" mt="sm">
                            {suggestionChips.map(chip => (
                                <Badge
                                    key={chip.label}
                                    variant="outline"
                                    color="grape"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setQuery(chip.query);
                                        // Auto trigger search in next tick ideally, but setting query is good start
                                        // Creating a wrapper to set and search would be better UI but this works
                                    }}
                                >
                                    {chip.label}
                                </Badge>
                            ))}
                        </Group>
                    )}
                </Box>

                {/* Results Area */}
                <Collapse in={expanded}>
                    <Box style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                        <Group justify="flex-end" px="md" pt="xs">
                            <ActionIcon variant="subtle" color="gray" size="xs" onClick={() => {
                                setExpanded(false);
                                setResponse(null);
                                setQuery('');
                            }}>
                                <IconX size={14} />
                            </ActionIcon>
                        </Group>
                        {loading ? renderThinking() : renderContent()}
                    </Box>
                </Collapse>
            </Stack>
        </Paper>
    );
};
