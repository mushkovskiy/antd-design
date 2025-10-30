# Batch Query Hook

## Обзор

`useBatchQuery` - это кастомный хук, который работает аналогично `useBatchMutation`, но использует `useQuery` вместо `useMutation`. Это позволяет автоматически кэшировать результаты и загружать данные декларативно.

## Основные отличия от useBatchMutation

| Характеристика | useBatchMutation | useBatchQuery |
|----------------|------------------|---------------|
| **Базовый хук** | `useMutation` | `useQuery` + `useQueries` |
| **Триггер** | Ручной (через `mutateBatch`/`mutateBatchAsync`) | Автоматический (при изменении `items`) |
| **Кэширование** | Нет | Да (автоматическое) |
| **Использование** | Для изменения данных | Для получения данных |
| **Повторные запросы** | Нужно вызывать заново | Берутся из кэша |
| **Фоновое обновление** | Нет | Да (через `staleTime`) |

## Преимущества useQuery

### 1. Автоматическое кэширование

```typescript
// При первом запросе - выполняется 3 запроса к API
const usersBatch = useUsersBatchQuery(['user_1', 'user_2', ..., 'user_1300']);

// При повторном запросе с теми же ID - данные берутся из кэша мгновенно
const usersBatch2 = useUsersBatchQuery(['user_1', 'user_2', ..., 'user_1300']);
```

### 2. Умное кэширование по батчам

Каждый батч кэшируется отдельно, что позволяет эффективно переиспользовать данные:

```typescript
// Запрос 1: загружаем 1300 ID (3 батча: 500+500+300)
const batch1 = useUsersBatchQuery(ids1_1300);

// Запрос 2: загружаем 1000 ID, первые 1000 из которых совпадают
// Первые 2 батча берутся из кэша, загружается только последний!
const batch2 = useUsersBatchQuery(ids1_1000);
```

### 3. Декларативный подход

```typescript
// useBatchMutation - императивный стиль
const mutation = useUsersBatch();
const handleClick = async () => {
  await mutation.mutateBatchAsync(userIds);
};

// useBatchQuery - декларативный стиль
const [userIds, setUserIds] = useState([]);
const query = useUsersBatchQuery(userIds); // Загружается автоматически

const handleClick = () => {
  setUserIds(newIds); // Просто меняем состояние
};
```

### 4. Фоновое обновление данных

```typescript
const query = useUsersBatchQuery(userIds);
// Через 5 минут (staleTime) данные автоматически обновятся в фоне
// при следующем рендере компонента
```

## Архитектура

### Принцип работы

1. **Разбиение на батчи**: Массив `items` разбивается на части по `batchSize` элементов
2. **Создание запросов**: Для каждого батча создаётся отдельный `useQuery` через `useQueries`
3. **Уникальные ключи**: Каждый батч получает уникальный ключ: `[...queryKey, 'batch', index, batch]`
4. **Параллельное выполнение**: Все запросы выполняются параллельно
5. **Кэширование**: Результаты каждого батча кэшируются отдельно
6. **Агрегация**: Результаты всех батчей объединяются в один результат

### Структура ключей кэша

```typescript
// Базовый ключ
['users', 'batch']

// Ключи для батчей (для 1300 ID)
['users', 'batch', 'batch', 0, ['user_1', ..., 'user_500']]
['users', 'batch', 'batch', 1, ['user_501', ..., 'user_1000']]
['users', 'batch', 'batch', 2, ['user_1001', ..., 'user_1300']]
```

Включение содержимого батча в ключ позволяет кэшировать результаты точно по тем ID, которые были запрошены.

## Использование

### Базовый пример

```typescript
import { useBatchQuery } from './hooks/useBatchQuery';

function MyComponent() {
  const [userIds, setUserIds] = useState<string[]>([]);
  
  const query = useBatchQuery({
    items: userIds,
    queryKey: ['users', 'batch'],
    queryFn: async (batch: string[]) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({ ids: batch }),
      });
      return response.json();
    },
    batchSize: 500,
    queryOptions: {
      staleTime: 5 * 60 * 1000, // 5 минут
      cacheTime: 10 * 60 * 1000, // 10 минут
    },
  });

  return (
    <div>
      {query.isLoading && <div>Загрузка: {query.progress}%</div>}
      {query.isSuccess && <div>Загружено: {query.data.data.length} батчей</div>}
    </div>
  );
}
```

### Специализированный хук

```typescript
// src/hooks/useUsersBatchQuery.ts
export function useUsersBatchQuery(userIds: string[]) {
  return useBatchQuery<UsersResponse, string>({
    items: userIds,
    queryKey: ['users', 'batch'],
    queryFn: async (userIdsBatch: string[]) => {
      return fetchUsersByIds(userIdsBatch);
    },
    batchSize: 500,
    queryOptions: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 2,
      retryDelay: 1000,
      enabled: userIds.length > 0,
    },
  });
}
```

### Использование в компоненте

```typescript
function UsersList() {
  const [userIds, setUserIds] = useState<string[]>([]);
  const usersBatch = useUsersBatchQuery(userIds);

  const loadUsers = () => {
    const ids = parseFile(); // Получаем 1300 ID
    setUserIds(ids); // Запросы запустятся автоматически
  };

  const allUsers = usersBatch.data?.data.flatMap(batch => batch.users) || [];

  return (
    <div>
      <button onClick={loadUsers} disabled={usersBatch.isLoading}>
        Загрузить
      </button>
      
      {usersBatch.isLoading && (
        <Progress percent={usersBatch.progress} />
      )}
      
      {allUsers.map(user => (
        <div key={user.id}>{user.fullName}</div>
      ))}
    </div>
  );
}
```

## API

### Конфигурация (BatchQueryConfig)

```typescript
interface BatchQueryConfig<TData, TVariables, TError = Error> {
  // Функция для выполнения запроса для одного батча
  queryFn: (batch: TVariables[]) => Promise<TData>;
  
  // Базовый ключ для кэширования
  queryKey: unknown[];
  
  // Максимальный размер батча (по умолчанию 500)
  batchSize?: number;
  
  // Массив элементов для обработки
  items: TVariables[];
  
  // Дополнительные опции для useQuery
  queryOptions?: Omit<UseQueryOptions<TData, TError>, 'queryFn' | 'queryKey'>;
}
```

### Результат (UseBatchQueryResult)

```typescript
interface UseBatchQueryResult<TData, TError = Error> {
  // Агрегированные данные из всех батчей
  data: BatchQueryResult<TData> | undefined;
  
  // Статусы
  isLoading: boolean;      // Хотя бы один батч загружается
  isFetching: boolean;     // Хотя бы один батч обновляется
  isSuccess: boolean;      // Все батчи успешно загружены
  isError: boolean;        // Хотя бы один батч с ошибкой
  
  // Первая ошибка
  error: TError | null;
  
  // Прогресс (0-100)
  progress: number;
  
  // Функция перезапроса
  refetch: () => Promise<void>;
  
  // Доступ к отдельным батчам
  batches: UseQueryResult<TData, TError>[];
}
```

### BatchQueryResult

```typescript
interface BatchQueryResult<TData> {
  // Массив результатов всех успешных батчей
  data: TData[];
  
  // Количество батчей
  totalBatches: number;
  
  // Количество успешно выполненных
  completedBatches: number;
  
  // Массив ошибок
  errors: Error[];
}
```

## Настройки кэширования

### staleTime

Время, в течение которого данные считаются "свежими". Пока данные свежие, повторные запросы не выполняются.

```typescript
queryOptions: {
  staleTime: 5 * 60 * 1000, // 5 минут
}
```

### cacheTime

Время, в течение которого неиспользуемые данные хранятся в кэше.

```typescript
queryOptions: {
  cacheTime: 10 * 60 * 1000, // 10 минут
}
```

### enabled

Условие для выполнения запроса.

```typescript
queryOptions: {
  enabled: userIds.length > 0, // Запрос выполнится только если есть ID
}
```

## Примеры использования

### 1. Загрузка при монтировании

```typescript
function Component() {
  // Данные загрузятся сразу при монтировании
  const query = useUsersBatchQuery(['user_1', 'user_2', 'user_3']);
  
  return <div>{/* ... */}</div>;
}
```

### 2. Условная загрузка

```typescript
function Component() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [userIds, setUserIds] = useState([]);
  
  const query = useBatchQuery({
    items: userIds,
    queryKey: ['users'],
    queryFn: fetchUsers,
    queryOptions: {
      enabled: shouldLoad && userIds.length > 0,
    },
  });
  
  return (
    <button onClick={() => setShouldLoad(true)}>
      Загрузить
    </button>
  );
}
```

### 3. Ручной рефетч

```typescript
function Component() {
  const query = useUsersBatchQuery(userIds);
  
  return (
    <div>
      <button onClick={() => query.refetch()}>
        Обновить данные
      </button>
    </div>
  );
}
```

### 4. Работа с отдельными батчами

```typescript
function Component() {
  const query = useUsersBatchQuery(userIds);
  
  return (
    <div>
      <h3>Статус батчей:</h3>
      {query.batches.map((batch, index) => (
        <div key={index}>
          Батч #{index + 1}: 
          {batch.isLoading && ' загружается...'}
          {batch.isSuccess && ' готов'}
          {batch.isError && ' ошибка'}
        </div>
      ))}
    </div>
  );
}
```

## Когда использовать что

### Используйте useBatchMutation когда:

- Нужно изменить данные (POST, PUT, DELETE)
- Операция должна выполняться по требованию
- Не нужно кэширование
- Важна явная инициация действия

### Используйте useBatchQuery когда:

- Нужно получить данные (GET)
- Данные могут кэшироваться
- Хотите автоматическую загрузку при изменении параметров
- Нужно фоновое обновление данных

## Производительность

### Оптимизация через кэширование

```typescript
// Сценарий: пользователь несколько раз запрашивает одни и те же данные

// 1-й запрос: 1300 ID → 3 HTTP-запроса
const query1 = useUsersBatchQuery(ids);

// 2-й запрос (через 1 минуту): те же 1300 ID → 0 HTTP-запросов (из кэша)
const query2 = useUsersBatchQuery(ids);

// 3-й запрос (через 6 минут): те же 1300 ID → 3 HTTP-запроса (данные устарели)
const query3 = useUsersBatchQuery(ids);
```

### Частичное кэширование

```typescript
// Запрос 1: ID 1-1300 → 3 батча
const query1 = useUsersBatchQuery(ids_1_1300);

// Запрос 2: ID 1-1000 → первые 2 батча из кэша, 0 новых запросов
const query2 = useUsersBatchQuery(ids_1_1000);

// Запрос 3: ID 1001-1600 → 3-й батч из кэша, 1 новый запрос для 1301-1600
const query3 = useUsersBatchQuery(ids_1001_1600);
```

## Лучшие практики

### 1. Правильная настройка времени кэширования

```typescript
// Для часто меняющихся данных
queryOptions: {
  staleTime: 1 * 60 * 1000,  // 1 минута
  cacheTime: 5 * 60 * 1000,  // 5 минут
}

// Для редко меняющихся данных
queryOptions: {
  staleTime: 60 * 60 * 1000,  // 1 час
  cacheTime: 24 * 60 * 60 * 1000,  // 24 часа
}
```

### 2. Использование enabled для контроля запросов

```typescript
const query = useBatchQuery({
  items: userIds,
  queryKey: ['users'],
  queryFn: fetchUsers,
  queryOptions: {
    enabled: userIds.length > 0 && userIds.length <= 10000,
  },
});
```

### 3. Обработка ошибок

```typescript
const query = useUsersBatchQuery(userIds);

if (query.isError) {
  // Показываем ошибку первого неудачного батча
  return <div>Ошибка: {query.error?.message}</div>;
}

if (query.data && query.data.errors.length > 0) {
  // Показываем предупреждение о частичном успехе
  return (
    <div>
      Загружено {query.data.completedBatches} из {query.data.totalBatches} батчей
      <div>Ошибок: {query.data.errors.length}</div>
    </div>
  );
}
```

### 4. Оптимизация размера батча

```typescript
// Для медленных соединений - меньшие батчи
const query = useBatchQuery({
  items: userIds,
  queryKey: ['users'],
  queryFn: fetchUsers,
  batchSize: 100, // Вместо 500
});

// Для быстрых API - большие батчи
const query = useBatchQuery({
  items: userIds,
  queryKey: ['users'],
  queryFn: fetchUsers,
  batchSize: 1000,
});
```

## Сравнение с useBatchMutation

### Пример: загрузка пользователей

#### useBatchMutation (императивный)

```typescript
function Component() {
  const [users, setUsers] = useState([]);
  const mutation = useUsersBatch();

  const loadUsers = async () => {
    const result = await mutation.mutateBatchAsync(userIds);
    const allUsers = result.data.flatMap(batch => batch.users);
    setUsers(allUsers);
  };

  return (
    <div>
      <button onClick={loadUsers}>Загрузить</button>
      {mutation.isPending && <Spinner />}
      {users.map(user => <UserCard user={user} />)}
    </div>
  );
}
```

#### useBatchQuery (декларативный)

```typescript
function Component() {
  const [userIds, setUserIds] = useState([]);
  const query = useUsersBatchQuery(userIds);
  
  const allUsers = query.data?.data.flatMap(batch => batch.users) || [];

  const loadUsers = () => {
    setUserIds(parseFile()); // Просто меняем состояние
  };

  return (
    <div>
      <button onClick={loadUsers}>Загрузить</button>
      {query.isLoading && <Spinner />}
      {allUsers.map(user => <UserCard user={user} />)}
    </div>
  );
}
```

## Заключение

`useBatchQuery` - это мощный инструмент для работы с большими объёмами данных, который предоставляет:

- ✅ Автоматическое кэширование
- ✅ Декларативный подход
- ✅ Фоновое обновление
- ✅ Умное переиспользование данных
- ✅ Простой API

Используйте его для всех GET-запросов, где нужна пакетная обработка данных.

