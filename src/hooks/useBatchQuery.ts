import { useQuery, useQueries } from '@tanstack/react-query';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';

/**
 * Конфигурация для батч-запроса
 */
export interface BatchQueryConfig<TData, TVariables, TError = Error> {
  /**
   * Функция для выполнения одного запроса с батчем данных
   * Будет вызвана несколько раз, если общее количество элементов превышает batchSize
   * Например: если передано 1300 ID и batchSize=500, функция будет вызвана 3 раза:
   * - 1-й вызов: массив из 500 элементов
   * - 2-й вызов: массив из 500 элементов
   * - 3-й вызов: массив из 300 элементов
   */
  queryFn: (batch: TVariables[]) => Promise<TData>;
  
  /**
   * Базовый ключ для кэширования запросов
   * Например: ['users', 'batch']
   */
  queryKey: unknown[];
  
  /**
   * Максимальный размер батча (по умолчанию 500)
   */
  batchSize?: number;
  
  /**
   * Дополнительные опции для useQuery
   */
  queryOptions?: Omit<
    UseQueryOptions<TData, TError>,
    'queryFn' | 'queryKey'
  >;
}

/**
 * Результат выполнения батч-запроса
 */
export interface BatchQueryResult<TData> {
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
 * Результат useBatchQuery с дополнительными полями для батч-обработки
 */
export interface UseBatchQueryResult<TData, TError = Error> {
  /**
   * Агрегированные данные из всех батчей
   */
  data: BatchQueryResult<TData> | undefined;
  
  /**
   * Статус загрузки - true если хотя бы один батч загружается
   */
  isLoading: boolean;
  
  /**
   * Статус загрузки первичных данных
   */
  isFetching: boolean;
  
  /**
   * Статус успеха - true если все батчи загружены успешно
   */
  isSuccess: boolean;
  
  /**
   * Статус ошибки - true если хотя бы один батч завершился с ошибкой
   */
  isError: boolean;
  
  /**
   * Первая ошибка из всех батчей
   */
  error: TError | null;
  
  /**
   * Текущий прогресс выполнения (0-100)
   */
  progress: number;
  
  /**
   * Функция для перезапроса всех батчей
   */
  refetch: () => Promise<void>;
  
  /**
   * Информация о каждом отдельном батче
   */
  batches: UseQueryResult<TData, TError>[];
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
 * Кастомный хук для выполнения батч-запросов с автоматическим разбиением на части
 * 
 * Принцип работы:
 * 1. Вы передаёте массив данных любого размера (например, 1300 ID)
 * 2. Хук автоматически разбивает его на батчи по batchSize элементов (например, по 500)
 * 3. Для каждого батча создаётся отдельный useQuery с уникальным ключом
 * 4. Все запросы выполняются параллельно
 * 5. useQuery автоматически кэширует результаты каждого батча
 * 6. Результаты агрегируются и возвращаются вместе с метаданными
 * 
 * Преимущества использования useQuery:
 * - Автоматическое кэширование: повторные запросы с теми же ID берутся из кэша
 * - Фоновое обновление данных (staleTime, cacheTime)
 * - Автоматический рефетч при изменении параметров
 * - Встроенное управление состоянием загрузки и ошибок
 * 
 * @example
 * ```tsx
 * const fetchUsers = useBatchQuery({
 *   items: userIds, // Массив из 1300 ID
 *   queryKey: ['users', 'batch'],
 *   queryFn: async (userIdsBatch: string[]) => {
 *     const response = await fetch('/api/users', {
 *       method: 'POST',
 *       body: JSON.stringify({ ids: userIdsBatch })
 *     });
 *     return response.json();
 *   },
 *   batchSize: 500,
 *   queryOptions: {
 *     staleTime: 5 * 60 * 1000, // Данные актуальны 5 минут
 *     cacheTime: 10 * 60 * 1000, // Хранить в кэше 10 минут
 *   }
 * });
 * 
 * // Использование
 * if (fetchUsers.isLoading) {
 *   return <div>Загрузка: {fetchUsers.progress}%</div>;
 * }
 * 
 * if (fetchUsers.isError) {
 *   return <div>Ошибка: {fetchUsers.error?.message}</div>;
 * }
 * 
 * return <div>Загружено: {fetchUsers.data?.data.length} результатов</div>;
 * ```
 */
export function useBatchQuery<TData = unknown, TVariables = unknown, TError = Error>({
  queryFn,
  queryKey,
  batchSize = 500,
  queryOptions,
  items,
}: BatchQueryConfig<TData, TVariables, TError> & { items: TVariables[] }): UseBatchQueryResult<TData, TError> {
  // Разбиваем массив на батчи
  const batches = useMemo(() => chunkArray(items, batchSize), [items, batchSize]);
  
  // Создаём массив запросов для каждого батча
  // useQueries выполняет все запросы параллельно
  const queries = useQueries({
    queries: batches.map((batch, index) => ({
      queryKey: [...queryKey, 'batch', index, batch], // Уникальный ключ для каждого батча с содержимым для правильного кэширования
      queryFn: () => queryFn(batch),
      ...queryOptions,
    })),
  });

  // Вычисляем агрегированные данные и метрики
  const result = useMemo(() => {
    const successfulResults: TData[] = [];
    const errors: Error[] = [];
    let completedCount = 0;

    queries.forEach((query) => {
      if (query.isSuccess && query.data) {
        successfulResults.push(query.data);
        completedCount++;
      } else if (query.isError && query.error) {
        errors.push(query.error as Error);
        completedCount++;
      }
    });

    const totalBatches = batches.length;
    const progress = totalBatches > 0 ? Math.round((completedCount / totalBatches) * 100) : 0;

    return {
      data: {
        data: successfulResults,
        totalBatches,
        completedBatches: queries.filter((q) => q.isSuccess).length,
        errors,
      },
      progress,
      isLoading: queries.some((q) => q.isLoading),
      isFetching: queries.some((q) => q.isFetching),
      isSuccess: queries.every((q) => q.isSuccess),
      isError: queries.some((q) => q.isError),
      error: queries.find((q) => q.isError)?.error as TError | null || null,
    };
  }, [queries, batches.length]);

  // Функция для перезапроса всех батчей
  const refetch = useCallback(async () => {
    await Promise.all(queries.map((query) => query.refetch()));
  }, [queries]);

  return {
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isSuccess: result.isSuccess,
    isError: result.isError,
    error: result.error,
    progress: result.progress,
    refetch,
    batches: queries,
  };
}

