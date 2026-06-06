import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicRoute, ProtectedRoute } from './components/RouteGuard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { UserHome, OwnerDashboard, AdminDashboard } from './pages/Dashboards';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected General/Customer Routes */}
          <Route element={<ProtectedRoute allowedRoles={['user']} />}>
            <Route path="/" element={<UserHome />} />
          </Route>

          {/* Protected Store Owner Dashboard Routes */}
          <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
            <Route path="/owner" element={<OwnerDashboard />} />
          </Route>

          {/* Protected Admin Control Center Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Catch-all Routing */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
