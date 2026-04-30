import { Card, Box, Stack, Badge, Title, Text, Group } from '@mantine/core';

interface WelcomeCardProps {
    userName: string;
    membershipLabel?: string;
}

export function WelcomeCard({ userName, membershipLabel }: WelcomeCardProps) {
    return (
        <Box className="mesh-gradient" style={{
            borderRadius: 'var(--mantine-radius-lg)',
            overflow: 'hidden',
            height: '100%',
            position: 'relative',
        }}>
            <Card className="glass-card" style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.05)', // Even more subtle on top of mesh
            }} padding="xl">
                
                <Box style={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    opacity: 0.15,
                    color: 'white',
                    transform: 'rotate(15deg)'
                }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="320"
                        height="320"
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

                <Stack gap="lg" style={{ position: 'relative', zIndex: 1 }}>
                    <Badge 
                        variant="white" 
                        color="orange.9" 
                        radius="sm" 
                        size="lg" 
                        style={{ 
                            width: 'fit-content', 
                            fontWeight: 900,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                        }}
                    >
                        PLATAFORMA GESTIÓN DE ROLES
                    </Badge>

                    <Stack gap={0}>
                        <Title order={1} style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '3.5rem',
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                            color: 'white'
                        }}>
                            Hola,<br />
                            <Text span inherit fw={800}>
                                {userName}
                            </Text>
                        </Title>
                        {membershipLabel && (
                            <Box mt={10}>
                                <Badge
                                    variant="gradient"
                                    gradient={{ from: 'rgba(255,255,255,0.25)', to: 'rgba(255,255,255,0.1)' }}
                                    size="lg"
                                    radius="sm"
                                    style={{
                                        border: '1px solid rgba(255,255,255,0.35)',
                                        color: 'white',
                                        fontWeight: 800,
                                        fontSize: '0.78rem',
                                        letterSpacing: '0.08em',
                                        backdropFilter: 'blur(6px)',
                                        textTransform: 'uppercase',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                    }}
                                >
                                    ✦ {membershipLabel}
                                </Badge>
                            </Box>
                        )}
                    </Stack>

                    <Box style={{
                        background: 'rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(4px)',
                        borderLeft: '4px solid var(--mantine-color-yellow-4)',
                        padding: '24px',
                        borderRadius: '0 12px 12px 0',
                        marginTop: '8px',
                        maxWidth: '92%'
                    }}>
                        <Text size="xl" fs="italic" fw={600} c="white" style={{ lineHeight: 1.5 }}>
                            "Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres..."
                        </Text>
                        <Group gap="xs" mt={12}>
                            <Text fw={900} size="sm" c="yellow.4" style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                                COLOSENSES 3:23
                            </Text>
                        </Group>
                    </Box>
                </Stack>
            </Card>
        </Box>
    );
}
