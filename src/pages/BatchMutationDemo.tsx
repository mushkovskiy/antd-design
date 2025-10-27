import { useState } from 'react';
import { Button, Card, Space, Typography, Progress, Statistic, Alert, Input, message } from 'antd';
import { UserOutlined, CloudUploadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useUsersBatch } from '../hooks/useUsersBatch';
import type { User } from '../types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * Демонстрация работы батч-мутаций
 * Показывает как обрабатывать большие массивы данных с автоматическим разбиением на батчи
 */
export function BatchMutationDemo() {
  const [userIds, setUserIds] = useState<string>('');
  const [loadedUsers, setLoadedUsers] = useState<User[]>([]);
  const usersBatch = useUsersBatch();

  // Генерация тестовых ID
  const generateTestIds = (count: number) => {
    const ids = Array.from({ length: count }, (_, i) => `user_${i + 1}`);
    setUserIds(ids.join('\n'));
    message.success(`Сгенерировано ${count} ID пользователей`);
  };

  // Обработка загрузки пользователей
  const handleLoadUsers = async () => {
    const ids = userIds
      .split('\n')
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      message.warning('Введите ID пользователей (по одному на строку)');
      return;
    }

    try {
      // Хук автоматически разбивает массив на батчи
      // Например: 1300 ID -> 3 запроса (500, 500, 300)
      const result = await usersBatch.mutateBatchAsync(ids);
      
      // Агрегируем пользователей из всех батчей
      const allUsers = result.data.flatMap((batch) => batch.users);
      setLoadedUsers(allUsers);

      if (result.errors.length > 0) {
        message.warning(
          `Загружено ${allUsers.length} пользователей, но ${result.errors.length} батчей завершились с ошибкой`
        );
      } else {
        message.success(`Успешно загружено ${allUsers.length} пользователей из ${result.totalBatches} батчей`);
      }
    } catch (error) {
      message.error('Ошибка при загрузке пользователей: ' + (error as Error).message);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>
        <CloudUploadOutlined /> Демонстрация Батч-Мутаций
      </Title>
      
      <Paragraph>
        Этот пример демонстрирует работу с кастомным хуком <code>useBatchMutation</code>,
        который автоматически разбивает большие массивы данных на батчи и выполняет запросы параллельно.
      </Paragraph>

      <Alert
        message="Ограничение API"
        description="Сервис принимает максимум 500 записей за один запрос. При парсинге файлов может получиться 1000, 1300, 1500 или больше ID. Хук автоматически разбивает их на батчи (например, 1300 ID → 3 запроса: 500+500+300) и выполняет параллельно через Promise.all."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Статистика */}
        <Card>
          <Space size="large" wrap>
            <Statistic 
              title="Прогресс выполнения" 
              value={usersBatch.progress} 
              suffix="%" 
            />
            <Statistic 
              title="Загружено пользователей" 
              value={loadedUsers.length} 
              prefix={<UserOutlined />} 
            />
            <Statistic 
              title="Статус" 
              value={
                usersBatch.isPending 
                  ? 'Загрузка...' 
                  : usersBatch.isSuccess 
                  ? 'Завершено' 
                  : usersBatch.isError
                  ? 'Ошибка'
                  : 'Ожидание'
              }
            />
          </Space>
        </Card>

        {/* Прогресс-бар */}
        {usersBatch.isPending && (
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Обработка батчей...</Text>
              <Progress 
                percent={usersBatch.progress} 
                status={usersBatch.isPending ? 'active' : 'success'}
              />
              {usersBatch.data && (
                <Text type="secondary">
                  Завершено батчей: {usersBatch.data.completedBatches} из {usersBatch.data.totalBatches}
                </Text>
              )}
            </Space>
          </Card>
        )}

        {/* Ошибки */}
        {usersBatch.isError && (
          <Alert
            message="Ошибка при загрузке"
            description={usersBatch.error?.message || 'Неизвестная ошибка'}
            type="error"
            showIcon
          />
        )}

        {/* Ввод ID */}
        <Card title="ID пользователей" extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => generateTestIds(500)}
              disabled={usersBatch.isPending}
            >
              500 ID
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => generateTestIds(1000)}
              disabled={usersBatch.isPending}
            >
              1000 ID
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => generateTestIds(1300)}
              disabled={usersBatch.isPending}
              type="primary"
            >
              1300 ID (3 батча)
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => generateTestIds(1500)}
              disabled={usersBatch.isPending}
            >
              1500 ID
            </Button>
          </Space>
        }>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Введите ID пользователей (по одному на строку) или используйте кнопки генерации</Text>
            <TextArea
              rows={8}
              placeholder="user_1&#10;user_2&#10;user_3"
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              disabled={usersBatch.isPending}
            />
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              loading={usersBatch.isPending}
              onClick={handleLoadUsers}
              size="large"
            >
              {usersBatch.isPending ? `Загрузка (${usersBatch.progress}%)` : 'Загрузить пользователей'}
            </Button>
          </Space>
        </Card>

        {/* Результаты */}
        {loadedUsers.length > 0 && (
          <Card title={`Загружено пользователей: ${loadedUsers.length}`}>
            <Space direction="vertical" style={{ width: '100%', maxHeight: '400px', overflow: 'auto' }}>
              {loadedUsers.slice(0, 50).map((user) => (
                <Card key={user.id} size="small" style={{ backgroundColor: '#f5f5f5' }}>
                  <Space>
                    <UserOutlined />
                    <Text strong>{user.fullName}</Text>
                    <Text type="secondary">ID: {user.id}</Text>
                  </Space>
                </Card>
              ))}
              {loadedUsers.length > 50 && (
                <Text type="secondary">... и ещё {loadedUsers.length - 50} пользователей</Text>
              )}
            </Space>
          </Card>
        )}

        {/* Техническая информация */}
        {usersBatch.data && (
          <Card title="Техническая информация">
            <Space direction="vertical">
              <Text>Всего батчей: <strong>{usersBatch.data.totalBatches}</strong></Text>
              <Text>Успешных батчей: <strong>{usersBatch.data.completedBatches}</strong></Text>
              <Text>Ошибок: <strong>{usersBatch.data.errors.length}</strong></Text>
              <Text>Размер батча: <strong>500 записей</strong></Text>
              <Text type="secondary">
                Все запросы выполняются параллельно через Promise.all()
              </Text>
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
}

