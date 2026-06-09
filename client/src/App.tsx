import { Route, Routes } from 'react-router-dom';
import { BreadcrumbProvider } from './context/BreadcrumbContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import AppLayout from './layouts/AppLayout';
import LecturerLoginPage from './pages/auth/LecturerLoginPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CoursesPage from './pages/CoursesPage';
import Dashboard from './pages/Dashboard';
import ForumPage from './pages/ForumPage';
import LandingPage from './pages/LandingPage';
import PostPage from './pages/PostPage';
import ProfilePage from './pages/ProfilePage';
import ResourcesPage from './pages/ResourcesPage';
import Sessions from './pages/Sessions';
import Subjects from './pages/Subjects';

function AuthenticatedLayout() {
  return (
    <BreadcrumbProvider>
      <AppLayout />
    </BreadcrumbProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/lecturer/login" element={<LecturerLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AuthenticatedLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard allow={['STUDENT', 'LECTURER']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/forums/:id" element={<ForumPage />} />
            <Route path="/posts/:id" element={<PostPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
