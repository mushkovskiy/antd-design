import { useBatchQuery } from './useBatchQuery';
import { fetchUsersByIds } from '../api/usersApi';
import type { UsersResponse } from '../types';

/**
 * Кастомный хук для получения пользователей батчами с использованием useQuery
 * Автоматически разбивает большие массивы ID на части по 500 элементов
 * и выполняет запросы параллельно с кэшированием
 * 
 * Преимущества перед useBatchMutation:
 * - Автоматическое кэширование результатов
 * - Повторные запросы берутся из кэша
 * - Фоновое обновление данных
 * - Не нужно вручную вызывать функцию - данные загружаются автоматически
 * 
 * @example
 * ```tsx
 * function Component() {
 *   const [userIds, setUserIds] = useState<string[]>([]);
 *   const usersBatch = useUsersBatchQuery(userIds);
 * 
 *   const handleLoadUsers = () => {
 *     const allUserIds = parseFileWithIds(); // Например, 1500 ID
 *     setUserIds(allUserIds); // Просто устанавливаем ID - запросы выполнятся автоматически
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleLoadUsers}>
 *         Загрузить пользователей
 *       </button>
 *       {usersBatch.isLoading && <p>Загрузка: {usersBatch.progress}%</p>}
 *       {usersBatch.isSuccess && (
 *         <p>Загружено: {usersBatch.data?.data.length} батчей</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @param userIds - массив ID пользователей для загрузки
 * @returns результат батч-запроса с агрегированными данными и статусами
 */
export function useUsersBatchQuery(userIds: string[]) {
  return useBatchQuery<UsersResponse, string>({
    items: userIds,
    queryKey: ['users', 'batch'],
    queryFn: async (userIdsBatch: string[]) => {
      // Вызываем API с батчем ID
      return fetchUsersByIds(userIdsBatch);
    },
    batchSize: 500, // Максимальный размер батча согласно ограничениям API
    queryOptions: {
      // Настройки кэширования
      staleTime: 5 * 60 * 1000, // Данные актуальны 5 минут
      cacheTime: 10 * 60 * 1000, // Хранить в кэше 10 минут
      
      // Дополнительные опции
      retry: 2, // Повторять запрос 2 раза при ошибке
      retryDelay: 1000, // Задержка между повторами 1 секунда
      
      // Запускать запрос только если есть ID
      enabled: userIds.length > 0,
    },
  });
}

