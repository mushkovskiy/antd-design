/**
 * Сокращает ФИО для отображения в тегах
 * Пример: "Иванов Сергей Евгеньевич" -> "Иванов С.Е."
 */
export const shortenFullName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  
  if (parts.length === 1) {
    return parts[0];
  }
  
  if (parts.length === 2) {
    return `${parts[0]} ${parts[1][0]}.`;
  }
  
  if (parts.length >= 3) {
    return `${parts[0]} ${parts[1][0]}.${parts[2][0]}.`;
  }
  
  return fullName;
};

/**
 * Проверяет, нужно ли сокращать имена (если выбрано больше одной опции)
 */
export const shouldShortenNames = (selectedCount: number): boolean => {
  return selectedCount > 1;
};
