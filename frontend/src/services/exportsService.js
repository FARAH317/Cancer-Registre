import api from './api';

const BASE = '/exports';

// Helper : déclenche un téléchargement depuis un blob
async function downloadFile(url, params = {}) {
  const resp = await api.get(url, { params, responseType: 'blob' });
  const contentDisposition = resp.headers['content-disposition'] || '';
  const match = contentDisposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : 'export';
  const href = window.URL.createObjectURL(new Blob([resp.data]));
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(href);
}

export const exportsService = {
  info: () => api.get(`${BASE}/info/`),

  // Excel
  patientsXlsx:    (params) => downloadFile(`${BASE}/excel/patients/`, params),
  diagnosticsXlsx: (params) => downloadFile(`${BASE}/excel/diagnostics/`, params),
  rapportXlsx:     (params) => downloadFile(`${BASE}/excel/rapport/`, params),

  // CanReg5
  canreg5: (params) => downloadFile(`${BASE}/canreg5/`, params),

  // PDF
  fichePatientPdf: (patientId) => downloadFile(`${BASE}/pdf/patient/${patientId}/`),
  rapportPdf:      (params)    => downloadFile(`${BASE}/pdf/rapport/`, params),
};
