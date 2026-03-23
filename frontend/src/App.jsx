import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
// import Login from "./pages/Login"; // Removed - using role-specific logins
import ParentLogin from "./pages/ParentLogin";
import TeacherLogin from "./pages/TeacherLogin";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";
import Programs from "./pages/Programs";
import Contact from "./pages/Contact";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ParentDashboard from "./pages/ParentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ChildManagement from "./pages/ChildManagement";
import AddChild from "./pages/AddChild";
import TeacherManagement from "./pages/TeacherManagement";
import AddTeacher from "./pages/AddTeacher";
import ClassAllocation from "./pages/ClassAllocation";
import AdminPaymentDashboard from "./pages/AdminPaymentDashboard";
import AdminRecordPayment from "./pages/AdminRecordPayment";
import AdminAttendance from "./pages/AdminAttendance";
import AdminReports from "./pages/AdminReports";
import AdminEvents from "./pages/AdminEvents";
import AdminNotifications from "./pages/AdminNotifications";
import AdminParentManagement from "./pages/AdminParentManagement";
import AdminAcademicYears from "./pages/AdminAcademicYears";
import TeacherLayout from "./components/TeacherLayout";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherAttendance from "./pages/TeacherAttendance";
import TeacherHomework from "./pages/TeacherHomework";
import TeacherBehaviorReports from "./pages/TeacherBehaviorReports";
import TeacherMealPlanning from "./pages/TeacherMealPlanning";
import TeacherHealthInfo from "./pages/TeacherHealthInfo";
import TeacherClassChildren from "./pages/TeacherClassChildren";
import TeacherNotifications from "./pages/TeacherNotifications";
import TeacherAddHomework from "./pages/TeacherAddHomework";
import TeacherHomeworkTracking from "./pages/TeacherHomeworkTracking";


import ParentLayout from "./components/ParentLayout";
import ChildProfile from "./pages/ChildProfile";
import ParentChildren from "./pages/ParentChildren";
import ParentPayments from "./pages/ParentPayments";
import ParentNotifications from "./pages/ParentNotifications";
import ParentEvents from "./pages/ParentEvents";
import UploadReceipt from "./pages/UploadReceipt";




function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        {/* <Route path="/login" element={<Login />} /> */} {/* Removed - using role-specific logins */}
        {/* Specific Role Logins */}
        <Route path="/parent-login" element={<ParentLogin />} />
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />


        {/* <Route path="/register" element={<Register />} /> */}
        <Route path="/programs" element={<Programs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />



        {/* Protected routes */}
        {/* Protected routes */}
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRole="PARENT">
              <ParentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ParentDashboard />} />
          <Route path="child-profile/:id" element={<ChildProfile />} />
          <Route path="children" element={<ParentChildren />} />
          <Route path="payments" element={<ParentPayments />} />
          <Route path="notifications" element={<ParentNotifications />} />
          <Route path="events" element={<ParentEvents />} />
          <Route path="upload-receipt" element={<UploadReceipt />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="children" element={<ChildManagement />} />
          <Route path="children/new" element={<AddChild />} />
          <Route path="teachers" element={<TeacherManagement />} />
          <Route path="teachers/new" element={<AddTeacher />} />
          <Route path="classes" element={<ClassAllocation />} />
          <Route path="payments" element={<AdminPaymentDashboard />} />
          <Route path="payments/new" element={<AdminRecordPayment />} />


          {/* New Routes */}
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="parents" element={<AdminParentManagement />} />
          <Route path="academic-years" element={<AdminAcademicYears />} />
        </Route>

        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRole="TEACHER">
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="my-class" element={<TeacherClassChildren />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="homework" element={<TeacherHomework />} />
          <Route path="homework/new" element={<TeacherAddHomework />} />
          <Route path="homework/edit/:id" element={<TeacherAddHomework />} />
          <Route path="homework/tracking/:homeworkId" element={<TeacherHomeworkTracking />} />

          <Route path="behavior-reports" element={<TeacherBehaviorReports />} />
          <Route path="meal-planning" element={<TeacherMealPlanning />} />
          <Route path="health-info" element={<TeacherHealthInfo />} />
          <Route path="notifications" element={<TeacherNotifications />} />
        </Route>

        {/* Fallback: unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
