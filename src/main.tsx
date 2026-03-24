import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { DatesProvider } from '@mantine/dates';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import App from './App';
import './index.css';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { theme } from './theme';
import { inject } from '@vercel/analytics';


inject();
dayjs.locale('es');

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <MantineProvider theme={theme}>
            <DatesProvider settings={{ locale: 'es', firstDayOfWeek: 0, weekendDays: [0] }}>
                <Notifications position="top-right" />
                <App />
            </DatesProvider>
        </MantineProvider>
    </React.StrictMode>,
);

// Desregistrar Service Worker problemático (resuelve el problema de pantalla blanca)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
                registration.unregister();
                console.log('Service Worker unregistered successfully');
            }
        });
    });
}
