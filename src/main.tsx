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
import { registerSW } from 'virtual:pwa-register';
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: "production",
  });
}

inject();
dayjs.locale('es');

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    void updateSW(true);
  },
  onRegisteredSW(_swUrl, registration) {
    void registration?.update();
  },
});

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
