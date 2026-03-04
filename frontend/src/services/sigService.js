// frontend/src/services/sigService.js
import axios from './axiosConfig'; // adjust to your axios setup

export const sigService = {
  overview: () => axios.get('/api/sig/overview/'),
  wilayaDetail: (code) => axios.get(`/api/sig/wilaya/${code}/`),
};