// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import LoginForm from "./components/LoginForm";
import StacksPage from "./pages/StacksPage";
import StackDetail from "./pages/StackDetail";

// Prüfen, ob man eingeloggt ist oder man sich im Demo-Account befindet
function PrivateRoute({ children }) {
  const { currentUser, isDemo } = useAuth();
  return currentUser || isDemo ? children : <Navigate to="/login" />;
}

export default function App() {
  const { currentUser, isDemo } = useAuth();
  return (
    <>
      <Navbar />

      <Routes>
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/" /> : <LoginForm />}
        />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <StacksPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/stacks/:id"
          element={
            <PrivateRoute>
              <StackDetail />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}
