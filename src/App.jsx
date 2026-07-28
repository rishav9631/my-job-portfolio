import "./App.css";
import { Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import History from "./pages/History";
import CoverLetter from "./pages/CoverLetter";
import CompareResume from "./pages/CompareResume";
import ATSScanner from "./pages/ATSScanner";
import MyResume from "./pages/MyResume";
import MassMailer from "./pages/MassMailer";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000814]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#10b981]/30 border-t-[#10b981] rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const { isAuthenticated, loading } = useAuth();

  return (
   <div className="flex flex-col min-h-screen">
    {isAuthenticated && <Navbar />}
    <main className="flex-grow">
      <Routes>
        <Route path="/login" element={
          loading ? null : (isAuthenticated ? <Navigate to="/" replace /> : <Login />)
        } />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/mass-mailer" element={<ProtectedRoute><MassMailer /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/cover-letter" element={<ProtectedRoute><CoverLetter /></ProtectedRoute>} />
        <Route path="/compare-resume" element={<ProtectedRoute><CompareResume /></ProtectedRoute>} />
        <Route path="/ats-scanner" element={<ProtectedRoute><ATSScanner /></ProtectedRoute>} />
        <Route path="/my-resume" element={<ProtectedRoute><MyResume /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        {/* Catch-all: redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
   </div>
  );
}

export default App;
