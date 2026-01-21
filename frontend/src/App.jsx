import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Programs from "./pages/Programs";
import Contact from "./pages/Contact";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ParentDashboard from "./pages/ParentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ChildManagement from "./pages/ChildManagement";
import AddChild from "./pages/AddChild";
import TeacherManagement from "./pages/TeacherManagement";
import AddTeacher from "./pages/AddTeacher";
import ClassAllocation from "./pages/ClassAllocation";






function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/children" element={<ChildManagement />} />
        <Route path="/admin/children/new" element={<AddChild />} />
        <Route path="/admin/teachers" element={<TeacherManagement />} />
        <Route path="/admin/teachers/new" element={<AddTeacher />} />
        <Route path="/admin/classes" element={<ClassAllocation />} />


        {/* Protected routes */}
        <Route
          path="/parent-dashboard"
          element={
            <ProtectedRoute allowedRole="PARENT">
              <ParentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback: unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
