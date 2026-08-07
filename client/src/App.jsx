import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import { useAuthStore } from "./store/authStore";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <FullScreenSpinner />;
  if (user) return <Navigate to="/chat" replace />;
  return children;
}

function FullScreenSpinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-mist-100 dark:bg-ink-950">
      <div className="h-8 w-8 rounded-full border-2 border-signal border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <Signup />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}
