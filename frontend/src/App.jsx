import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, lazy, Suspense } from 'react';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PatientsPage from './pages/patients/PatientsPage';
import NewPatientPage from './pages/patients/NewPatientPage';
import PatientDetailPage from './pages/patients/PatientDetailPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import DiagnosticsPage from './pages/diagnostics/DiagnosticsPage';
import NewDiagnosticPage from './pages/diagnostics/NewDiagnosticPage';
import DiagnosticDetailPage from './pages/diagnostics/DiagnosticDetailPage';
import TraitementsPage from './pages/traitements/TraitementsPage';
import NewTraitementPage from './pages/traitements/NewTraitementPage';
import TraitementDetailPage from './pages/traitements/TraitementDetailPage';
import SuiviPage from './pages/suivi/SuiviPage';
import NewConsultationPage, { NewEvenementPage } from './pages/suivi/NewConsultationPage';
import ConsultationDetailPage from './pages/suivi/ConsultationDetailPage';
import RCPPage from './pages/rcp/RCPPage';
import NewRCPPage, { NewDossierRCPPage } from './pages/rcp/NewRCPPage';
import RCPDetailPage from './pages/rcp/RCPDetailPage';
import StatistiquesPage from './pages/statistiques/StatistiquesPage';
import ExportsPage from './pages/exports/ExportsPage';
import { AppLayout } from './components/layout/Sidebar';
import useAuthStore from './hooks/useAuth';
import './styles/globals.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}


function ComingSoon({ title }) {
  return (
    <AppLayout title={title}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 360 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🚧</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>{title}</div>
          <div style={{ fontSize: 13 }}>Module en cours de développement</div>
        </div>
      </div>
    </AppLayout>
  );
}

function App() {
  const { initAuth } = useAuthStore();
  useEffect(() => { initAuth(); }, [initAuth]);

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
          },
        }}
      />
      <Routes>
        {/* Auth publique */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

        {/* ── Patients ── */}
        <Route path="/patients"         element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
        <Route path="/patients/nouveau" element={<ProtectedRoute><NewPatientPage /></ProtectedRoute>} />
        <Route path="/patients/:id"     element={<ProtectedRoute><PatientDetailPage /></ProtectedRoute>} />

        {/* Modules à venir */}
        <Route path="/diagnostics"         element={<ProtectedRoute><DiagnosticsPage /></ProtectedRoute>} />
        <Route path="/diagnostics/nouveau" element={<ProtectedRoute><NewDiagnosticPage /></ProtectedRoute>} />
        <Route path="/diagnostics/:id"     element={<ProtectedRoute><DiagnosticDetailPage /></ProtectedRoute>} />
        <Route path="/traitements"          element={<ProtectedRoute><TraitementsPage /></ProtectedRoute>} />
        <Route path="/traitements/nouveau" element={<ProtectedRoute><NewTraitementPage /></ProtectedRoute>} />
        <Route path="/traitements/:type/:id" element={<ProtectedRoute><TraitementDetailPage /></ProtectedRoute>} />
        <Route path="/suivi"                        element={<ProtectedRoute><SuiviPage /></ProtectedRoute>} />
        <Route path="/suivi/consultations/nouveau"  element={<ProtectedRoute><NewConsultationPage /></ProtectedRoute>} />
        <Route path="/suivi/consultations/:id"      element={<ProtectedRoute><ConsultationDetailPage /></ProtectedRoute>} />
        <Route path="/suivi/evenements/nouveau"     element={<ProtectedRoute><NewEvenementPage /></ProtectedRoute>} />
        <Route path="/statistiques" element={<ProtectedRoute><StatistiquesPage /></ProtectedRoute>} />
        <Route path="/carte"        element={<ProtectedRoute><ComingSoon title="Carte SIG" /></ProtectedRoute>} />
        <Route path="/rcp"                      element={<ProtectedRoute><RCPPage /></ProtectedRoute>} />
        <Route path="/rcp/nouveau"              element={<ProtectedRoute><NewRCPPage /></ProtectedRoute>} />
        <Route path="/rcp/:id"                  element={<ProtectedRoute><RCPDetailPage /></ProtectedRoute>} />
        <Route path="/rcp/dossier/nouveau"      element={<ProtectedRoute><NewDossierRCPPage /></ProtectedRoute>} />
        <Route path="/exports"      element={<ProtectedRoute><ExportsPage /></ProtectedRoute>} />
        <Route path="/admin"        element={<ProtectedRoute><ComingSoon title="Administration" /></ProtectedRoute>} />

        {/* Redirect par défaut */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
