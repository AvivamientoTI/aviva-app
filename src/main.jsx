import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
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
import { UserProvider } from './contexts/UserContext';
import { theme } from './theme';

dayjs.locale('es');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <DatesProvider settings={{ locale: 'es', firstDayOfWeek: 0, weekendDays: [0] }}>
        <Notifications position="top-right" />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <UserProvider>
            <App />
          </UserProvider>
        </BrowserRouter>
      </DatesProvider>
    </MantineProvider>
  </React.StrictMode>,
);
