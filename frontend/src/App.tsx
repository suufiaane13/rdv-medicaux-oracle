import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { AgendaPage } from "@/pages/AgendaPage";
import { HomePage } from "@/pages/HomePage";
import { HistoriqueRdvPage } from "@/pages/HistoriqueRdvPage";
import { LoginPage } from "@/pages/LoginPage";
import { MedecinsPage } from "@/pages/MedecinsPage";
import { PatientsPage } from "@/pages/PatientsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/historique-rdv" element={<HistoriqueRdvPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/medecins" element={<MedecinsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
