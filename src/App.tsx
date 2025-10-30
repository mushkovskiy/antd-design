import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ConfigProvider, Layout, Menu } from 'antd';
import { AppstoreOutlined, CloudUploadOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import CustomSelectDemo from './pages/CustomSelectDemo';
import { BatchMutationDemo } from './pages/BatchMutationDemo';
import { BatchQueryDemo } from './pages/BatchQueryDemo';
import 'antd/dist/reset.css';

const { Header, Content } = Layout;

// Конфигурация темы Ant Design
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
};

const App: React.FC = () => {
  const [current, setCurrent] = React.useState('custom-select-demo');

  return (
    <ConfigProvider theme={theme}>
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Header style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%' }}>
            <Menu
              theme="dark"
              mode="horizontal"
              selectedKeys={[current]}
              onClick={(e) => setCurrent(e.key)}
              items={[
                {
                  key: 'custom-select-demo',
                  icon: <AppstoreOutlined />,
                  label: <Link to="/custom-select-demo">Custom Select</Link>,
                },
                {
                  key: 'batch-mutation-demo',
                  icon: <CloudUploadOutlined />,
                  label: <Link to="/batch-mutation-demo">Batch Mutation</Link>,
                },
                {
                  key: 'batch-query-demo',
                  icon: <CloudDownloadOutlined />,
                  label: <Link to="/batch-query-demo">Batch Query</Link>,
                },
              ]}
            />
          </Header>
          <Content>
            <Routes>
              <Route path="/" element={<Navigate to="/custom-select-demo" replace />} />
              <Route path="/custom-select-demo" element={<CustomSelectDemo />} />
              <Route path="/batch-mutation-demo" element={<BatchMutationDemo />} />
              <Route path="/batch-query-demo" element={<BatchQueryDemo />} />
            </Routes>
          </Content>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;
