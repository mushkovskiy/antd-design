import type { UsersResponse } from '../types';

/**
 * API для работы с пользователями
 */

/**
 * Получает информацию о пользователях по их ID
 * Сервис принимает максимум 500 ID за один запрос
 * 
 * @param userIds - массив ID пользователей (максимум 500)
 * @returns Promise с информацией о пользователях
 */
export async function fetchUsersByIds(userIds: string[]): Promise<UsersResponse> {
  // Для демонстрации используем задержку и мок-данные
  // В реальном проекте здесь будет настоящий API-запрос
  
  // Логируем количество ID в текущем батче
  console.log(`[API] Получен запрос на загрузку ${userIds.length} пользователей`);
  console.log(`[API] Первый ID: ${userIds[0]}, Последний ID: ${userIds[userIds.length - 1]}`);
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация задержки сети

  // Мок-ответ
  const users = userIds.map(id => ({
    id,
    fullName: `User ${id}`,
  }));

  console.log(`[API] Возвращено ${users.length} пользователей`);

  return {
    users,
    total: users.length,
  };

  // Реальная реализация для вашего API:
  /*
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids: userIds }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }

  return response.json();
  */
}

