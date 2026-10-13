import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { AppLayout } from './layouts/AppLayout';

// Public pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';

// Authenticated pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PoliciesPage } from './pages/policies/PoliciesPage';
import { UploadPolicyPage } from './pages/policies/UploadPolicyPage';
import { PolicyDetailPage } from './pages/policies/PolicyDetailPage';
import { NewClaimPage } from './pages/claims/NewClaimPage';
import { ClaimResultPage } from './pages/claims/ClaimResultPage';
import { ClaimsHistoryPage } from './pages/claims/ClaimsHistoryPage';

// Admin pages
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { UsersPage } from './pages/admin/UsersPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* ── Authenticated routes (all roles) ── */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Policies — /policies/upload must come before /policies/:id */}
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="/policies/upload" element={<UploadPolicyPage />} />
            <Route path="/policies/:id" element={<PolicyDetailPage />} />

            {/* Claims — /claims/new must come before /claims/:referenceCode */}
            <Route path="/claims/new" element={<NewClaimPage />} />
            <Route path="/claims" element={<ClaimsHistoryPage />} />
            <Route path="/claims/:referenceCode" element={<ClaimResultPage />} />
          </Route>

          {/* ── Admin-only routes ── */}
          <Route element={<AppLayout requiredRoles={['ADMIN']} />}>
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
