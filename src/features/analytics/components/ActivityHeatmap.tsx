import { Box, Tooltip, Text, Group, Stack, useMantineTheme } from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

interface HeatmapData {
    date: string;
    count: number;
}

interface ActivityHeatmapProps {
    data: HeatmapData[];
}

export const ActivityHeatmap = ({ data }: ActivityHeatmapProps) => {
    const theme = useMantineTheme();
    const currentYear = dayjs().year();
    const startDate = dayjs(`${currentYear}-01-01`).startOf('week');
    const endDate = dayjs(`${currentYear}-12-31`).endOf('week');

    // Create a map for quick lookup
    const dataMap = new Map(data.map(d => [d.date, d.count]));

    // Generate all days to show in the grid
    const totalDays = endDate.diff(startDate, 'day') + 1;
    const days = Array.from({ length: totalDays }, (_, i) => {
        const date = startDate.add(i, 'day');
        const dateStr = date.format('YYYY-MM-DD');
        const count = dataMap.get(dateStr) || 0;
        return {
            date: dateStr,
            count,
            isCurrentYear: date.year() === currentYear,
            dayOfWeek: date.day(),
            month: date.month()
        };
    });

    const getColor = (count: number) => {
        if (count === 0) return theme.colors.gray[1];
        if (count < 2) return theme.colors.teal[2];
        if (count < 4) return theme.colors.teal[4];
        if (count < 6) return theme.colors.teal[6];
        return theme.colors.teal[8];
    };

    const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return (
        <Stack gap="xs">
            <Group gap={4} wrap="nowrap" style={{ overflowX: 'auto', paddingBottom: 8 }}>
                {/* Labels for days of week */}
                <Stack gap={2} pt={20}>
                    {weekDays.map((day, i) => (
                        <Text key={i} size="xs" c="dimmed" style={{ height: 12, lineHeight: '12px', fontSize: 10 }}>
                            {i % 2 === 0 ? day : ''}
                        </Text>
                    ))}
                </Stack>

                <Stack gap={4}>
                    {/* Month labels */}
                    <Group gap={0} wrap="nowrap" style={{ height: 16 }}>
                        {months.map((month) => {
                            // Rough estimation of month position
                            const monthWidth = (totalDays / 12) * 14; 
                            return (
                                <Box key={month} style={{ width: monthWidth }}>
                                    <Text size="xs" c="dimmed" fw={600} style={{ fontSize: 10 }}>{month}</Text>
                                </Box>
                            );
                        })}
                    </Group>

                    {/* Heatmap Grid (Columns are weeks) */}
                    <Box style={{ 
                        display: 'grid', 
                        gridTemplateRows: 'repeat(7, 12px)', 
                        gridAutoFlow: 'column', 
                        gap: 3,
                        gridTemplateColumns: `repeat(${Math.ceil(totalDays / 7)}, 12px)`
                    }}>
                        {days.map((day) => (
                            <Tooltip
                                key={day.date}
                                label={`${dayjs(day.date).format('D MMM')}: ${day.count} servicios`}
                                position="top"
                                withArrow
                                offset={4}
                            >
                                <Box
                                    className="heatmap-cell"
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 2,
                                        backgroundColor: day.isCurrentYear ? getColor(day.count) : 'transparent',
                                        cursor: day.isCurrentYear ? 'pointer' : 'default',
                                    }}
                                />
                            </Tooltip>
                        ))}
                    </Box>
                </Stack>
            </Group>

            <Group justify="flex-end" gap={4}>
                <Text size="xs" c="dimmed">Menos</Text>
                {[0, 1, 3, 5, 7].map(lvl => (
                    <Box key={lvl} w={10} h={10} style={{ backgroundColor: getColor(lvl), borderRadius: 2 }} />
                ))}
                <Text size="xs" c="dimmed">Más</Text>
            </Group>
        </Stack>
    );
};
