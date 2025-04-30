import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import RegisterPage from './pages/RegisterPage';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import SearchTenderPage from './pages/SearchTenderPage';
import TenderDetailPage from './pages/DetailTenderPage';
import SubmissionsPage from './pages/SubmissionsPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tenders/search" element={<SearchTenderPage />} />
            <Route path="/tenders/registered" element={<div>Registered Tenders Page</div>} />
            <Route path="/my-tenders" element={<div>My Tenders Page</div>} />
            <Route path="/tenders/:id" element={<TenderDetailPage />} />
            <Route path="/tenders/:id/submissions/:address" element={<SubmissionsPage />} />
            {/* <Route path="/settings" element={SearchTenderPage} /> */}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App; 