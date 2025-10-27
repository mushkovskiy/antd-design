# Батч-мутации с TanStack Query

## Описание проблемы

При работе с API, которое имеет ограничение на количество обрабатываемых записей (например, максимум 500 записей за запрос), возникает проблема при обработке больших массивов данных.

**Пример сценария:**
- API принимает POST-запрос с массивом ID пользователей
- Максимум: 500 ID за один запрос
- Реальные данные: может быть 1000, 1500 или более ID из парсинга файлов

## Решение

Кастомный хук `useBatchMutation` автоматически:
1. ✅ Разбивает большой массив на батчи (chunks) по 500 элементов
2. ✅ Выполняет все запросы параллельно через `Promise.all()`
3. ✅ Агрегирует результаты со всех батчей
4. ✅ Обрабатывает ошибки, сохраняя успешные результаты
5. ✅ Отслеживает прогресс выполнения (0-100%)
6. ✅ Интегрируется с TanStack Query для управления состоянием

## Архитектура решения

### Базовый хук `useBatchMutation`

```typescript
import { useBatchMutation } from './hooks/useBatchMutation';

const batchMutation = useBatchMutation({
  mutationFn: async (batch: string[]) => {
    // Функция для выполнения одного батча
    return fetchApi(batch);
  },
  batchSize: 500, // Размер батча
  mutationOptions: {
    // Стандартные опции useMutation
    retry: 2,
    onSuccess: (result) => {
      console.log('Все батчи выполнены:', result);
    },
  },
});
```

### Специализированный хук для пользователей

```typescript
// src/hooks/useUsersBatch.ts
export function useUsersBatch() {
  return useBatchMutation<UsersResponse, string>({
    mutationFn: fetchUsersByIds,
    batchSize: 500,
    mutationOptions: {
      retry: 2,
      retryDelay: 1000,
    },
  });
}
```

## Использование

### Простой пример

```tsx
import { useUsersBatch } from './hooks/useUsersBatch';

function MyComponent() {
  const usersBatch = useUsersBatch();

  const handleLoad = async () => {
    const allIds = ['user_1', 'user_2', /* ... 1500 ID ... */];
    
    try {
      const result = await usersBatch.mutateBatchAsync(allIds);
      console.log('Загружено пользователей:', result.data.length);
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  return (
    <button onClick={handleLoad} disabled={usersBatch.isPending}>
      Загрузить пользователей
    </button>
  );
}
```

### Пример с отслеживанием прогресса

```tsx
function MyComponentWithProgress() {
  const usersBatch = useUsersBatch();

  return (
    <div>
      <button 
        onClick={() => usersBatch.mutateBatch(allIds)}
        disabled={usersBatch.isPending}
      >
        {usersBatch.isPending 
          ? `Загрузка... ${usersBatch.progress}%` 
          : 'Загрузить'
        }
      </button>
      
      {usersBatch.isPending && (
        <Progress percent={usersBatch.progress} />
      )}
      
      {usersBatch.data && (
        <p>
          Обработано батчей: {usersBatch.data.completedBatches} 
          из {usersBatch.data.totalBatches}
        </p>
      )}
      
      {usersBatch.isError && (
        <Alert type="error" message={usersBatch.error.message} />
      )}
    </div>
  );
}
```

## API

### `useBatchMutation`

#### Параметры

```typescript
interface BatchMutationConfig<TData, TVariables, TError> {
  // Функция для выполнения одного батча
  mutationFn: (batch: TVariables[]) => Promise<TData>;
  
  // Размер батча (по умолчанию 500)
  batchSize?: number;
  
  // Дополнительные опции TanStack Query
  mutationOptions?: UseMutationOptions<...>;
}
```

#### Возвращаемое значение

```typescript
interface UseBatchMutationResult<TData, TVariables, TError> {
  // Стандартные поля useMutation
  data: BatchMutationResult<TData> | undefined;
  error: TError | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  
  // Дополнительные поля
  progress: number; // 0-100
  
  // Функции для запуска
  mutateBatch: (items: TVariables[]) => void;
  mutateBatchAsync: (items: TVariables[]) => Promise<BatchMutationResult<TData>>;
}
```

#### Результат выполнения

```typescript
interface BatchMutationResult<TData> {
  // Массив результатов со всех батчей
  data: TData[];
  
  // Общее количество батчей
  totalBatches: number;
  
  // Количество успешно завершённых батчей
  completedBatches: number;
  
  // Ошибки, возникшие при выполнении
  errors: Error[];
}
```

## Преимущества решения

### 1. Автоматическое разбиение
Не нужно вручную делить массив на части - хук делает это автоматически.

### 2. Параллельное выполнение
Все батчи выполняются одновременно через `Promise.all()`, что значительно быстрее последовательного выполнения.

**Пример:**
- 1500 ID = 3 батча по 500
- Последовательно: 3 секунды × 3 = 9 секунд
- Параллельно: max(3 секунды) = 3 секунды ⚡

### 3. Устойчивость к ошибкам
Если один батч упал с ошибкой, успешные результаты других батчей всё равно вернутся.

### 4. Отслеживание прогресса
Встроенное отслеживание прогресса в процентах для UI.

### 5. Типобезопасность
Полная поддержка TypeScript с выводом типов.

### 6. Интеграция с TanStack Query
Все возможности TanStack Query: кэширование, повторы, оптимистичные обновления и т.д.

## Сравнение подходов

### ❌ Без батчинга

```typescript
// Проблема: API не примет больше 500 ID
const result = await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ ids: allIds }), // 1500 ID - ошибка!
});
```

### ❌ Последовательное выполнение

```typescript
const results = [];
for (const batch of batches) {
  const result = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ ids: batch }),
  });
  results.push(result);
}
// Проблема: медленно (3 + 3 + 3 = 9 секунд)
```

### ✅ Наше решение

```typescript
const usersBatch = useUsersBatch();
const result = await usersBatch.mutateBatchAsync(allIds);
// Быстро (3 секунды), с прогрессом, обработкой ошибок и типами
```

## Примеры использования в реальных сценариях

### Загрузка данных из файла

```typescript
function FileUploadComponent() {
  const usersBatch = useUsersBatch();
  
  const handleFileUpload = async (file: File) => {
    // Парсим файл и получаем ID
    const content = await file.text();
    const userIds = content.split('\n').filter(Boolean);
    
    console.log(`Найдено ${userIds.length} ID пользователей`);
    
    // Автоматически разобьёт на батчи и загрузит
    const result = await usersBatch.mutateBatchAsync(userIds);
    
    const totalUsers = result.data.reduce(
      (sum, batch) => sum + batch.users.length, 
      0
    );
    
    message.success(`Загружено ${totalUsers} пользователей`);
  };
  
  return <Upload onChange={handleFileUpload} />;
}
```

### Экспорт больших отчётов

```typescript
function ExportReport() {
  const reportBatch = useBatchMutation({
    mutationFn: async (reportIds: string[]) => {
      return generateReportBatch(reportIds);
    },
    batchSize: 500,
  });
  
  const handleExport = async () => {
    const allReportIds = getSelectedReports(); // 2000+ ID
    const result = await reportBatch.mutateBatchAsync(allReportIds);
    
    // Объединяем все части отчёта
    const fullReport = mergeReports(result.data);
    downloadReport(fullReport);
  };
}
```

## Техническая реализация

### Разбиение на батчи

```typescript
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### Параллельное выполнение с обработкой ошибок

```typescript
const batchPromises = batches.map((batch) =>
  mutationFn(batch)
    .then((result) => ({ success: true, data: result }))
    .catch((error) => ({ success: false, error }))
);

const results = await Promise.all(batchPromises);
```

## Запуск демо

```bash
npm install
npm run dev
```

Откройте http://localhost:5173/batch-mutation-demo и попробуйте:
1. Сгенерировать 1500 ID пользователей
2. Нажать "Загрузить пользователей"
3. Наблюдать за прогрессом выполнения
4. Увидеть результаты со всех батчей

## Заключение

Хук `useBatchMutation` решает проблему ограничений API на размер запросов, предоставляя:
- 🚀 Высокую производительность (параллельное выполнение)
- 🛡️ Надёжность (обработка ошибок)
- 📊 Прозрачность (отслеживание прогресса)
- 🔧 Гибкость (интеграция с TanStack Query)
- 💯 Типобезопасность (TypeScript)

Готово к использованию в production! 🎉

