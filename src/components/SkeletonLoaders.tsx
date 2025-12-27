import { Stack, Skeleton, Paper } from '@mantine/core';

export function CalendarSkeleton() {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
        }}>
            {[...Array(6)].map((_, i) => (
                <Paper key={i} p="md" withBorder radius="md">
                    <Stack gap="sm">
                        <Skeleton height={40} radius="md" />
                        <Skeleton height={60} radius="md" />
                        <Skeleton height={80} radius="md" />
                    </Stack>
                </Paper>
            ))}
        </div>
    );
}

interface TableSkeletonProps {
    rows?: number;
}

export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
    return (
        <Stack gap="sm">
            {[...Array(rows)].map((_, i) => (
                <Skeleton key={i} height={60} radius="md" />
            ))}
        </Stack>
    );
}

export function FormSkeleton() {
    return (
        <Stack gap="md">
            <Skeleton height={40} radius="md" />
            <Skeleton height={40} radius="md" />
            <Skeleton height={120} radius="md" />
            <Skeleton height={40} radius="md" width="30%" />
        </Stack>
    );
}
