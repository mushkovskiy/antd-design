import { useBatchMutation } from './useBatchMutation';
import { fetchUsersByIds } from '../api/usersApi';
import type { UsersResponse } from '../types';

/**
 * Кастомный хук для получения пользователей батчами
 * Автоматически разбивает большие массивы ID на части по 500 элементов
 * и выполняет запросы параллельно
 * 
 * @example
 * ```tsx
 * function Component() {
 *   const usersBatch = useUsersBatch();
 * 
 *   const handleLoadUsers = async () => {
 *     const allUserIds = parseFileWithIds(); // Например, 1500 ID
 *     
 *     try {
 *       const result = await usersBatch.mutateBatchAsync(allUserIds);
 *       console.log('Получено пользователей:', result.data);
 *       console.log('Прогресс:', usersBatch.progress);
 *     } catch (error) {
 *       console.error('Ошибка:', error);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleLoadUsers} disabled={usersBatch.isPending}>
 *         Загрузить пользователей
 *       </button>
 *       {usersBatch.isPending && <p>Загрузка: {usersBatch.progress}%</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUsersBatch() {
  return useBatchMutation<UsersResponse, string>({
    mutationFn: async (userIdsBatch: string[]) => {
      // Вызываем API с батчем ID
      return fetchUsersByIds(userIdsBatch);
    },
    batchSize: 500, // Максимальный размер батча согласно ограничениям API
    mutationOptions: {
      // Можно добавить дополнительные опции
      retry: 2, // Повторять запрос 2 раза при ошибке
      retryDelay: 1000, // Задержка между повторами 1 секунда
    },
  });
}

