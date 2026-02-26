import api from './api';

export const dashboardService = {
  global:  () => api.get('/registry/dashboard/'),
  alertes: () => api.get('/registry/alertes/'),
};
