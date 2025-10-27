import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

/**
 * Конфигурация для батч-мутации
 */
export interface BatchMutationConfig<TData, TVariables, TError = Error> {
  /**
   * Функция для выполнения одного запроса с батчем данных
   * Будет вызвана несколько раз, если общее количество элементов превышает batchSize
   * Например: если передано 1300 ID и batchSize=500, функция будет вызвана 3 раза:
   * - 1-й вызов: массив из 500 элементов
   * - 2-й вызов: массив из 500 элементов
   * - 3-й вызов: массив из 300 элементов
   */
  mutationFn: (batch: TVariables[]) => Promise<TData>;
  
  /**
   * Максимальный размер батча (по умолчанию 500)
   */
  batchSize?: number;
  
  /**
   * Дополнительные опции для useMutation
   */
  mutationOptions?: Omit<
    UseMutationOptions<BatchMutationResult<TData>, TError, TVariables[]>,
    'mutationFn'
  >;
}

/**
 * Результат выполнения батч-мутации
 */
export interface BatchMutationResult<TData> {
  /**
   * Агрегированные данные со всех батчей
   */
  data: TData[];
  
  /**
   * Общее количество батчей
   */
  totalBatches: number;
  
  /**
   * Количество успешно завершённых батчей
   */
  completedBatches: number;
  
  /**
   * Ошибки, возникшие при выполнении батчей
   */
  errors: Error[];
}

/**
 * Расширенный результат useMutation с дополнительными полями для батч-обработки
 */
export interface UseBatchMutationResult<TData, TVariables, TError = Error>
  extends Omit<UseMutationResult<BatchMutationResult<TData>, TError, TVariables[]>, 'mutate' | 'mutateAsync'> {
  /**
   * Функция для запуска батч-мутации
   * Принимает массив данных, который будет автоматически разбит на батчи
   */
  mutateBatch: (items: TVariables[]) => void;
  
  /**
   * Асинхронная версия mutateBatch
   */
  mutateBatchAsync: (items: TVariables[]) => Promise<BatchMutationResult<TData>>;
  
  /**
   * Текущий прогресс выполнения (0-100)
   */
  progress: number;
}

/**
 * Разбивает массив на части (chunks) заданного размера
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Кастомный хук для выполнения батч-мутаций с автоматическим разбиением на части
 * 
 * Принцип работы:
 * 1. Вы передаёте массив данных любого размера (например, 1300 ID)
 * 2. Хук автоматически разбивает его на батчи по batchSize элементов (например, по 500)
 * 3. Для каждого батча вызывается mutationFn с массивом элементов
 * 4. Все запросы выполняются параллельно
 * 5. Результаты агрегируются и возвращаются вместе с метаданными
 * 
 * @example
 * ```tsx
 * const fetchUsers = useBatchMutation({
 *   // Эта функция будет вызвана несколько раз, каждый раз с массивом до 500 ID
 *   mutationFn: async (userIds: string[]) => {
 *     const response = await fetch('/api/users', {
 *       method: 'POST',
 *       body: JSON.stringify({ ids: userIds })
 *     });
 *     return response.json();
 *   },
 *   batchSize: 500, // Размер каждого батча
 *   mutationOptions: {
 *     onSuccess: (result) => {
 *       console.log(`Выполнено ${result.totalBatches} запросов`);
 *       console.log(`Получено ${result.data.length} ответов`);
 *     }
 *   }
 * });
 * 
 * // Использование
 * const handleFetch = async () => {
 *   const userIds = parseFile(); // Получаем 1300 ID
 *   // Хук разобьёт это на 3 запроса: 500, 500, 300
 *   await fetchUsers.mutateBatchAsync(userIds);
 * };
 * ```
 */
export function useBatchMutation<TData = unknown, TVariables = unknown, TError = Error>({
  mutationFn,
  batchSize = 500,
  mutationOptions,
}: BatchMutationConfig<TData, TVariables, TError>): UseBatchMutationResult<TData, TVariables, TError> {
  const [progress, setProgress] = useState(0);

  // Основная мутация, которая обрабатывает все батчи
  const mutation = useMutation<BatchMutationResult<TData>, TError, TVariables[]>({
    mutationFn: async (items: TVariables[]) => {
      // Сбрасываем прогресс
      setProgress(0);
      
      // Разбиваем на батчи
      const batches = chunkArray(items, batchSize);
      
      // Если данных нет, возвращаем пустой результат
      if (batches.length === 0) {
        return {
          data: [],
          totalBatches: 0,
          completedBatches: 0,
          errors: [],
        };
      }

      // Создаём массив промисов для всех батчей
      // Каждый батч - это массив до batchSize элементов
      // Например: [500 элементов], [500 элементов], [300 элементов]
      let completedCount = 0;
      const batchPromises = batches.map((batch, index) =>
        // Вызываем mutationFn для каждого батча отдельно
        mutationFn(batch)
          .then((result) => {
            // Обновляем прогресс после успешного выполнения
            completedCount++;

            setProgress(Math.round((completedCount / batches.length) * 100));
            return { success: true as const, data: result, index };
          })
          .catch((error: Error) => {
            // Обновляем прогресс даже при ошибке
            completedCount++;
            setProgress(Math.round((completedCount / batches.length) * 100));
            return { success: false as const, error, index };
          })
      );

      // Ждём выполнения всех батчей параллельно
      const results = await Promise.all(batchPromises);

      // Агрегируем результаты
      const successfulResults: TData[] = [];
      const errors: Error[] = [];

      results.forEach((result) => {
        if (result.success) {
          successfulResults.push(result.data);
        } else {
          errors.push(result.error);
        }
      });

      // Если все батчи завершились с ошибкой, пробрасываем первую ошибку
      if (successfulResults.length === 0 && errors.length > 0) {
        throw errors[0];
      }

      return {
        data: successfulResults,
        totalBatches: batches.length,
        completedBatches: results.filter((r) => r.success).length,
        errors,
      };
    },
    ...mutationOptions,
  });

  // Обёртка для mutate
  const mutateBatch = useCallback(
    (items: TVariables[]) => {
      mutation.mutate(items);
    },
    [mutation]
  );

  // Обёртка для mutateAsync
  const mutateBatchAsync = useCallback(
    async (items: TVariables[]): Promise<BatchMutationResult<TData>> => {
      return mutation.mutateAsync(items);
    },
    [mutation]
  );
  console.log("🚀 ~ useBatchMutation ~ progress:", progress)
  return {
    ...mutation,
    mutateBatch,
    mutateBatchAsync,
    progress,
  };
}

