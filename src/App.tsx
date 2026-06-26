import { Routes, Route } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Parents from './pages/Parents';
import Children from './pages/Children';
import Teachers from './pages/Teachers';
import Batches from './pages/Batches';
import CourseList from './pages/courses/CourseList';
import AttendanceReports from './pages/attendance/AttendanceReports';
import AssignmentMonitoring from './pages/assignments/AssignmentMonitoring';
import FeeStructure from './pages/fees/FeeStructure';
import PaymentHistory from './pages/fees/PaymentHistory';
import EventList from './pages/events/EventList';
import GalleryManagement from './pages/gallery/GalleryManagement';
import NotificationCenter from './pages/notifications/NotificationCenter';
import Analytics from './pages/reports/Analytics';
import CMS from './pages/settings/CMS';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/parents" element={<Parents />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/children" element={<Children />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/attendance" element={<AttendanceReports />} />
        <Route path="/assignments" element={<AssignmentMonitoring />} />
        <Route path="/fees" element={<FeeStructure />} />
        <Route path="/fees/payments" element={<PaymentHistory />} />
        <Route path="/events" element={<EventList />} />
        <Route path="/gallery" element={<GalleryManagement />} />
        <Route path="/notifications" element={<NotificationCenter />} />
        <Route path="/reports" element={<Analytics />} />
        <Route path="/settings" element={<CMS />} />
      </Route>
    </Routes>
  );
}

export default App;
