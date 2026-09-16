import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { FoodManagerPage } from './pages/FoodManagerPage';
import { SeasonalMatrixPage } from './pages/SeasonalMatrixPage';
import { VoiceStudioPage } from './pages/VoiceStudioPage';
import { ClinicalRulesPage } from './pages/ClinicalRulesPage';
import { DHIMSExportPage } from './pages/DHIMSExportPage';
import { logout } from './api/client';

export default function App() {
  const [authed, setAuthed] = useState<boolean>(
    () => !!localStorage.getItem('access_token'),
  );

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  function handleLogout() {
    logout();
    setAuthed(false);
  }

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/foods" replace />} />
        <Route path="/foods" element={<FoodManagerPage />} />
        <Route path="/seasonal" element={<SeasonalMatrixPage />} />
        <Route path="/voice" element={<VoiceStudioPage />} />
        <Route path="/clinical" element={<ClinicalRulesPage />} />
        <Route path="/export" element={<DHIMSExportPage />} />
      </Routes>
    </Layout>
  );
}
