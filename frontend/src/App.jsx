import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import AdminLayout from './AdminLayout';
import CreateVanBanDi from './CreateVanBanDi';
import ListVanBanDi from './ListVanBanDi';
// 1. Thêm import component ListVanBanDen vừa tạo
import ListVanBanDen from './ListVanBanDen';
import ListHoSo from './ListHoSo';
import ListCanBo from './ListCanBo';
import ListCoQuan from './ListCoQuan';
import Dashboard from './Dashboard';
import ListTaiKhoan from './ListTaiKhoan';
import CreateQuyetDinh from './CreateQuyetDinh';
import OCRPage from './OCRPage';
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* ĐÃ SỬA: Xóa chữ Chào mừng, đặt Dashboard làm trang mặc định (index) */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="van-ban-di" element={<ListVanBanDi />} />
          <Route path="them-van-ban" element={<CreateVanBanDi />} />
          <Route path="sua-van-ban/:id" element={<CreateVanBanDi />} />
          <Route path="ho-so" element={<ListHoSo />} />
          <Route path="can-bo" element={<ListCanBo />} />
          <Route path="co-quan" element={<ListCoQuan />} />
          <Route path="tai-khoan" element={<ListTaiKhoan />} />
          {/* Luồng Văn bản đến */}
          <Route path="van-ban-den" element={<ListVanBanDen />} />
          <Route path="them-quyet-dinh" element={<CreateQuyetDinh />} />
          <Route path="ocr" element={<OCRPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;