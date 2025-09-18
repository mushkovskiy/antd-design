import React, { useMemo, useRef, useState } from 'react';
import { Card, Space, Typography, Divider, Row, Col } from 'antd';
import CustomSelect from '../components/CustomSelect';
import { getUserOptions } from '../utils/mockData';

const { Title, Paragraph, Text } = Typography;

const CustomSelectDemo: React.FC = () => {
  const [singleValue, setSingleValue] = useState<string>('');
  const [multipleValue, setMultipleValue] = useState<string[]>([]);
  
  const options = getUserOptions();

  // Remote search demo state
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteOptions, setRemoteOptions] = useState(options);
  const [remoteSearch, setRemoteSearch] = useState('');
  const [remoteValue, setRemoteValue] = useState<string>('');
  const debounceRef = useRef<number | null>(null);

  const doFetch = (query: string) => {
    setRemoteLoading(true);
    // Simulate API latency
    window.setTimeout(() => {
      const result = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
      setRemoteOptions(result);
      setRemoteLoading(false);
    }, 700);
  };

  const onRemoteSearch = (value: string) => {
    setRemoteSearch(value);
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => doFetch(value), 300);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Typography>
        <Title level={1}>Кастомный Select с поддержкой ФИО</Title>
        <Paragraph>
          Демонстрация работы кастомного компонента Select на основе Ant Design 
          с автоматическим сокращением ФИО при множественном выборе.
        </Paragraph>
      </Typography>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Одиночный выбор" style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                При одиночном выборе ФИО отображается полностью.
                Пропс <Text code>mode</Text> не устанавливается.
              </Paragraph>
              
              <CustomSelect
                allowMultiple={false}
                options={options}
                value={singleValue}
                onChange={(value) => setSingleValue(value as string)}
                placeholder="Выберите одного пользователя"
                style={{ width: '100%' }}
              />
              
              <div>
                <Text strong>Выбранное значение:</Text>
                <br />
                <Text code>{singleValue || 'Ничего не выбрано'}</Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Множественный выбор" style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                При множественном выборе пропс <Text code>mode</Text> устанавливается в 
                <Text code>'multiple'</Text>. Если выбрано больше одного пользователя, 
                ФИО автоматически сокращается через <Text code>tagRender</Text>.
              </Paragraph>
              
              <CustomSelect
                allowMultiple={true}
                options={options}
                value={multipleValue}
                onChange={(value) => setMultipleValue(value as string[])}
                placeholder="Выберите нескольких пользователей"
                style={{ width: '100%' }}
              />
              
              <div>
                <Text strong>Выбранные значения:</Text>
                <br />
                {multipleValue.length > 0 ? (
                  multipleValue.map((val, index) => (
                    <div key={index}>
                      <Text code>{val}</Text>
                    </div>
                  ))
                ) : (
                  <Text code>Ничего не выбрано</Text>
                )}
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Удалённый поиск (есть данные)">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                При удалённом поиске локальная фильтрация отключена (<Text code>filterOption=false</Text>),
                данные приходят из API, пока запрос идёт показывается <Text code>Spin</Text>.
              </Paragraph>
              <CustomSelect
                options={remoteOptions}
                value={remoteValue}
                onChange={(v) => setRemoteValue(v as string)}
                onSearch={onRemoteSearch}
                searchValue={remoteSearch}
                loading={remoteLoading}
                placeholder="Введите имя"
                style={{ width: '100%' }}
              />
              <div>
                <Text strong>Найдено опций:</Text> <Text code>{remoteOptions.length}</Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Удалённый поиск (нет данных)">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                Пример пустого ответа: список опций пуст, показываем текст "Ничего не найдено".
              </Paragraph>
              <CustomSelect
                options={[]}
                value={remoteValue}
                onChange={(v) => setRemoteValue(v as string)}
                onSearch={onRemoteSearch}
                searchValue={remoteSearch}
                loading={false}
                notFoundContent={<Text type="secondary">Ничего не найдено</Text>}
                placeholder="Введите имя"
                style={{ width: '100%' }}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="Особенности реализации">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={4}>Логика сокращения ФИО:</Title>
          <ul>
            <li>
              <Text>Если выбран 1 пользователь: </Text>
              <Text code>"Иванов Сергей Евгеньевич"</Text>
            </li>
            <li>
              <Text>Если выбрано 2+ пользователей: </Text>
              <Text code>"Иванов С.Е."</Text>
            </li>
          </ul>

          <Title level={4}>Технические детали:</Title>
          <ul>
            <li>Компонент принимает пропс <Text code>allowMultiple</Text> для управления режимом</li>
            <li>При <Text code>allowMultiple=true</Text> устанавливается <Text code>mode="multiple"</Text></li>
            <li>При <Text code>allowMultiple=false</Text> пропс mode не передается</li>
            <li>Кастомный <Text code>tagRender</Text> используется только при множественном выборе</li>
            <li>Поддерживается поиск по имени пользователя</li>
          </ul>

          <Title level={4}>Пример использования:</Title>
          <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
{`// Одиночный выбор
<CustomSelect
  allowMultiple={false}
  options={userOptions}
  value={selectedUser}
  onChange={setSelectedUser}
/>

// Множественный выбор  
<CustomSelect
  allowMultiple={true}
  options={userOptions}
  value={selectedUsers}
  onChange={setSelectedUsers}
/>`}
          </pre>
        </Space>
      </Card>
    </div>
  );
};

export default CustomSelectDemo;
