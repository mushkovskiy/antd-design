import type { SelectProps } from 'antd';
// Тип для пользователя
export interface User {
  id: string;
  fullName: string;
}

// Тип для опций Select
export interface SelectOption {
  label: string;
  value: string;
}

// Пропсы для кастомного Select
export interface CustomSelectProps {
  allowMultiple?: boolean;
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  onSearch?: (value: string) => void;
  searchValue?: string;
  loading?: boolean;
  notFoundContent?: React.ReactNode;
  filterOption?: SelectProps['filterOption'];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Типы для батч-запросов пользователей
export interface UsersRequest {
  ids: string[];
}

export interface UsersResponse {
  users: User[];
  total: number;
}