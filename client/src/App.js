import React from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import Invitation from './pages/Invitation';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route path="/invitation/:code" element={<Invitation />} />
        <Route path="/payment/:code" element={<Payment />} />
        <Route path="/payment-success/:code" element={<PaymentSuccess />} />
      </Routes>
    </Router>
  );
}

export default App;
