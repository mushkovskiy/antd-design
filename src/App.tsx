import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import CustomSelectDemo from './pages/CustomSelectDemo';
import 'antd/dist/reset.css';

// Конфигурация темы Ant Design
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
};

const App: React.FC = () => {
  return (
    <ConfigProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/custom-select-demo" replace />} />
          <Route path="/custom-select-demo" element={<CustomSelectDemo />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;
