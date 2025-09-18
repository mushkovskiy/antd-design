import { User, SelectOption } from '../types';

// Моковые данные пользователей
export const mockUsers: User[] = [
  { id: '1', fullName: 'Иванов Сергей Евгеньевич' },
  { id: '2', fullName: 'Петрова Анна Владимировна' },
  { id: '3', fullName: 'Смирнов Дмитрий Александрович' },
  { id: '4', fullName: 'Козлова Елена Игоревна' },
  { id: '5', fullName: 'Новиков Андрей Петрович' },
  { id: '6', fullName: 'Федорова Мария Сергеевна' },
  { id: '7', fullName: 'Морозов Павел Викторович' },
  { id: '8', fullName: 'Васильева Ольга Дмитриевна' },
  { id: '9', fullName: 'Соколов Алексей Николаевич' },
  { id: '10', fullName: 'Михайлова Татьяна Андреевна' },
  { id: '11', fullName: 'Белов Максим Романович' },
  { id: '12', fullName: 'Кузнецова Наталья Владимировна' },
];

// Функция для получения опций для Select
export const getUserOptions = (): SelectOption[] => {
  return mockUsers.map(user => ({
    label: user.fullName,
    value: user.fullName,
  }));
};
