
import { Card, Box, Stack, Badge, Title, Text, Group } from '@mantine/core';

interface WelcomeCardProps {
    userName: string;
}

export function WelcomeCard({ userName }: WelcomeCardProps) {
    return (
        <Card style={{
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            color: 'white',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 10px 20px -5px rgba(217, 119, 6, 0.3)'
        }} padding="xl" radius="lg" withBorder={false}>
            <Box style={{
                position: 'absolute',
                top: -40,
                right: -40,
                opacity: 0.1,
            }}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="280"
                    height="280"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 12c2 -2.96 0 -7 -1 -8c0 3.038 -1.773 4.741 -3 6c-1.226 1.26 -2 3.24 -2 5a6 6 0 1 0 12 0c0 -1.532 -1.056 -3.94 -2 -5c-1.786 3 -2.791 3 -4 2z" />
                </svg>
            </Box>

            <Stack gap="md" style={{ position: 'relative', zIndex: 1 }}>
                <Badge variant="filled" color="white" radius="sm" size="lg" style={{ width: 'fit-content', color: '#b45309', fontWeight: 800 }}>
                    PLATAFORMA LIDERAZGO
                </Badge>
                <Title order={1} style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '3rem',
                    lineHeight: 1,
                    letterSpacing: '-0.04em'
                }}>
                    Hola,<br />
                    <Text span c="white" inherit style={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        {userName}
                    </Text>
                </Title>

                <Box style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderLeft: '4px solid #ffffff',
                    padding: '24px',
                    borderRadius: '8px',
                    marginTop: '8px',
                    maxWidth: '90%'
                }}>
                    <Text size="lg" fs="italic" fw={700} c="white" style={{ lineHeight: 1.6 }}>
                        "Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres..."
                    </Text>
                    <Group gap="xs" mt={12}>
                        <Text fw={900} size="xs" c="yellow.1" style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                            COLOSENSES 3:23
                        </Text>
                    </Group>
                </Box>
            </Stack>
        </Card >
    );
}
