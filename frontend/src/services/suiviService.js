import api from './api';

export const suiviService = {
  // Consultations
  consultations: {
    list:      (params) => api.get('/suivi/consultations/', { params }),
    get:       (id)     => api.get(`/suivi/consultations/${id}/`),
    create:    (data)   => api.post('/suivi/consultations/', data),
    update:    (id, d)  => api.put(`/suivi/consultations/${id}/`, d),
    patch:     (id, d)  => api.patch(`/suivi/consultations/${id}/`, d),
    delete:    (id)     => api.delete(`/suivi/consultations/${id}/`),
    parPatient:(pid)    => api.get('/suivi/consultations/par_patient/', { params: { patient_id: pid } }),
    aVenir:    ()       => api.get('/suivi/consultations/a_venir/'),
    stats:     ()       => api.get('/suivi/consultations/stats/'),
  },

  // Qualité de vie
  qualiteVie: {
    list:             (params) => api.get('/suivi/qualite-vie/', { params }),
    get:              (id)     => api.get(`/suivi/qualite-vie/${id}/`),
    create:           (data)   => api.post('/suivi/qualite-vie/', data),
    update:           (id, d)  => api.put(`/suivi/qualite-vie/${id}/`, d),
    delete:           (id)     => api.delete(`/suivi/qualite-vie/${id}/`),
    evolutionPatient: (pid)    => api.get('/suivi/qualite-vie/evolution_patient/', { params: { patient_id: pid } }),
  },

  // Événements cliniques
  evenements: {
    list:       (params) => api.get('/suivi/evenements/', { params }),
    get:        (id)     => api.get(`/suivi/evenements/${id}/`),
    create:     (data)   => api.post('/suivi/evenements/', data),
    update:     (id, d)  => api.put(`/suivi/evenements/${id}/`, d),
    delete:     (id)     => api.delete(`/suivi/evenements/${id}/`),
    nonResolus: ()       => api.get('/suivi/evenements/non_resolus/'),
    stats:      ()       => api.get('/suivi/evenements/stats/'),
  },
};
