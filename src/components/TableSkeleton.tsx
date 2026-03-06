import { Table, Skeleton, Stack, Group, Card } from '@mantine/core';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    withHeader?: boolean;
}

export function TableSkeleton({ rows = 5, columns = 4, withHeader = true }: TableSkeletonProps) {
    return (
        <Card withBorder radius="md" p="md" style={{ width: '100%' }}>
            {withHeader && (
                <Group justify="space-between" mb="xl">
                    <Skeleton height={28} width="30%" radius="xl" />
                    <Skeleton height={36} width="20%" radius="xl" />
                </Group>
            )}
            <Table verticalSpacing="md">
                <Table.Thead>
                    <Table.Tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <Table.Th key={`th-${i}`}>
                                <Skeleton height={14} width="70%" radius="xl" />
                            </Table.Th>
                        ))}
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <Table.Tr key={`tr-${rowIndex}`}>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <Table.Td key={`td-${rowIndex}-${colIndex}`}>
                                    <Skeleton 
                                        height={12} 
                                        width={colIndex === 0 ? "80%" : colIndex === columns - 1 ? "40%" : "60%"} 
                                        radius="xl" 
                                    />
                                </Table.Td>
                            ))}
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
            <Stack align="flex-end" mt="xl">
                <Skeleton height={36} width="15%" radius="xl" />
            </Stack>
        </Card>
    );
}
