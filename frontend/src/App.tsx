import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthPage from './pages/AuthPage';
import RegisterPage from './pages/RegisterPage';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import SearchTenderPage from './pages/SearchTenderPage';
import TenderDetailPage from './pages/DetailTenderPage';
import SubmissionsPage from './pages/SubmissionsPage';
import MyTenders from './pages/MyTenderPage';
import AccessRequestsPage from './pages/AccessRequestsPage';
const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={<DashboardLayout />}>
            {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
            <Route path="/tenders/search" element={<SearchTenderPage />} />
            <Route path="/tenders/registered" element={<div>Registered Tenders Page</div>} />
            <Route path="/my-tenders" element={<MyTenders />} />
            <Route path="/access-requests" element={<AccessRequestsPage />} />
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