import { useState } from 'react';
import { Button, Card, Space, Typography, Progress, Statistic, Alert, Input, message, Tag } from 'antd';
import { UserOutlined, CloudDownloadOutlined, ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useUsersBatchQuery } from '../hooks/useUsersBatchQuery';
import type { User } from '../types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * Демонстрация работы батч-запросов с использованием useQuery
 * Показывает как обрабатывать большие массивы данных с автоматическим разбиением на батчи
 * и кэшированием результатов
 */
export function BatchQueryDemo() {
  const [userIdsInput, setUserIdsInput] = useState<string>('');
  const [userIds, setUserIds] = useState<string[]>([]);
  
  const usersBatch = useUsersBatchQuery(userIds);

  // Генерация тестовых ID
  const generateTestIds = (count: number) => {
    const ids = Array.from({ length: count }, (_, i) => `user_${i + 1}`);
    setUserIdsInput(ids.join('\n'));
    message.success(`Сгенерировано ${count} ID пользователей`);
  };

  // Обработка загрузки пользователей
  const handleLoadUsers = () => {
    const ids = userIdsInput
      .split('\n')
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      message.warning('Введите ID пользователей (по одному на строку)');
      return;
    }

    // Просто устанавливаем ID - запросы выполнятся автоматически
    setUserIds(ids);
    message.info(`Запускаем загрузку ${ids.length} пользователей...`);
  };

  // Очистка данных
  const handleClear = () => {
    setUserIds([]);
    setUserIdsInput('');
    message.info('Данные очищены');
  };

  // Агрегируем всех пользователей из всех батчей
  const allUsers = usersBatch.data?.data.flatMap((batch) => batch.users) || [];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>
        <CloudDownloadOutlined /> Демонстрация Батч-Запросов (useQuery)
      </Title>
      
      <Paragraph>
        Этот пример демонстрирует работу с кастомным хуком <code>useBatchQuery</code>,
        который использует <code>useQuery</code> для автоматической загрузки данных с кэшированием.
      </Paragraph>

      <Alert
        message="Преимущества useQuery"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>Автоматическое кэширование: повторные запросы с теми же ID берутся из кэша</li>
            <li>Фоновое обновление данных по истечении staleTime</li>
            <li>Не нужно вручную вызывать функцию - данные загружаются автоматически при изменении ID</li>
            <li>Встроенное управление состоянием загрузки и ошибок</li>
          </ul>
        }
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Alert
        message="Ограничение API"
        description="Сервис принимает максимум 500 записей за один запрос. При парсинге файлов может получиться 1000, 1300, 1500 или больше ID. Хук автоматически разбивает их на батчи (например, 1300 ID → 3 запроса: 500+500+300) и выполняет параллельно."
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
              value={allUsers.length} 
              prefix={<UserOutlined />} 
            />
            <Statistic 
              title="Статус" 
              valueRender={() => (
                usersBatch.isLoading 
                  ? <Tag color="processing">Загрузка...</Tag>
                  : usersBatch.isFetching
                  ? <Tag color="processing">Обновление...</Tag>
                  : usersBatch.isSuccess 
                  ? <Tag color="success">Завершено</Tag>
                  : usersBatch.isError
                  ? <Tag color="error">Ошибка</Tag>
                  : <Tag>Ожидание</Tag>
              )}
            />
            {usersBatch.isSuccess && (
              <Statistic 
                title="Кэширование" 
                valueRender={() => (
                  <Space>
                    <ClockCircleOutlined />
                    <Text>Активно</Text>
                  </Space>
                )}
              />
            )}
          </Space>
        </Card>

        {/* Прогресс-бар */}
        {(usersBatch.isLoading || usersBatch.isFetching) && (
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>
                {usersBatch.isLoading ? 'Обработка батчей...' : 'Обновление данных...'}
              </Text>
              <Progress 
                percent={usersBatch.progress} 
                status={usersBatch.isLoading || usersBatch.isFetching ? 'active' : 'success'}
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
            action={
              <Button size="small" onClick={() => usersBatch.refetch()}>
                Повторить
              </Button>
            }
          />
        )}

        {/* Ввод ID */}
        <Card title="ID пользователей" extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => generateTestIds(500)}
              disabled={usersBatch.isLoading}
            >
              500 ID
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => generateTestIds(1000)}
              disabled={usersBatch.isLoading}
            >
              1000 ID
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => generateTestIds(1300)}
              disabled={usersBatch.isLoading}
              type="primary"
            >
              1300 ID (3 батча)
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => generateTestIds(1500)}
              disabled={usersBatch.isLoading}
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
              value={userIdsInput}
              onChange={(e) => setUserIdsInput(e.target.value)}
              disabled={usersBatch.isLoading}
            />
            <Space>
              <Button
                type="primary"
                icon={<CloudDownloadOutlined />}
                loading={usersBatch.isLoading}
                onClick={handleLoadUsers}
                size="large"
              >
                {usersBatch.isLoading ? `Загрузка (${usersBatch.progress}%)` : 'Загрузить пользователей'}
              </Button>
              {userIds.length > 0 && (
                <>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => usersBatch.refetch()}
                    disabled={usersBatch.isLoading}
                  >
                    Обновить данные
                  </Button>
                  <Button onClick={handleClear}>
                    Очистить
                  </Button>
                </>
              )}
            </Space>
          </Space>
        </Card>

        {/* Результаты */}
        {allUsers.length > 0 && (
          <Card title={`Загружено пользователей: ${allUsers.length}`}>
            <Space direction="vertical" style={{ width: '100%', maxHeight: '400px', overflow: 'auto' }}>
              {allUsers.slice(0, 50).map((user) => (
                <Card key={user.id} size="small" style={{ backgroundColor: '#f5f5f5' }}>
                  <Space>
                    <UserOutlined />
                    <Text strong>{user.fullName}</Text>
                    <Text type="secondary">ID: {user.id}</Text>
                  </Space>
                </Card>
              ))}
              {allUsers.length > 50 && (
                <Text type="secondary">... и ещё {allUsers.length - 50} пользователей</Text>
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
                Все запросы выполняются параллельно через useQueries()
              </Text>
              <Text type="secondary">
                Результаты кэшируются на 10 минут (cacheTime: 10 * 60 * 1000)
              </Text>
              <Text type="secondary">
                Данные считаются актуальными 5 минут (staleTime: 5 * 60 * 1000)
              </Text>
            </Space>
          </Card>
        )}

        {/* Информация о кэшировании */}
        {usersBatch.isSuccess && (
          <Alert
            message="Кэширование активно"
            description="Попробуйте нажать 'Очистить' и затем снова 'Загрузить пользователей' с теми же ID - данные загрузятся мгновенно из кэша!"
            type="info"
            showIcon
          />
        )}

        {/* Информация о батчах */}
        {usersBatch.batches.length > 0 && (
          <Card title="Детали батчей">
            <Space direction="vertical" style={{ width: '100%' }}>
              {usersBatch.batches.map((batch, index) => (
                <Card key={index} size="small">
                  <Space>
                    <Text>Батч #{index + 1}:</Text>
                    {batch.isLoading && <Tag color="processing">Загрузка</Tag>}
                    {batch.isFetching && !batch.isLoading && <Tag color="processing">Обновление</Tag>}
                    {batch.isSuccess && <Tag color="success">Успех</Tag>}
                    {batch.isError && <Tag color="error">Ошибка</Tag>}
                    {batch.data && (
                      <Text type="secondary">
                        Загружено: {batch.data.users.length} пользователей
                      </Text>
                    )}
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
}

