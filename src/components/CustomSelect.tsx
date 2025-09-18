import React from 'react';
import { Select, Tag, Spin } from 'antd';
import type { SelectProps } from 'antd';
import type { CustomSelectProps } from '../types';
import { shortenFullName, shouldShortenNames } from '../utils/nameUtils';

const CustomSelect: React.FC<CustomSelectProps> = ({
  allowMultiple = false,
  options,
  value,
  onChange,
  onSearch,
  placeholder = 'Выберите пользователя',
  disabled = false,
  className,
  style,
  loading,
  notFoundContent,
  filterOption,
  searchValue,
  ...restProps
}) => {
  // Определяем режим Select
  const mode = allowMultiple ? 'multiple' : undefined;

  // Обработчик изменения значения
  const handleChange = (newValue: string | string[]) => {
    onChange?.(newValue);
  };

  // Кастомный рендер тегов для множественного выбора
  type TagRenderProps = Parameters<NonNullable<SelectProps['tagRender']>>[0];
  const tagRender = (props: TagRenderProps) => {
    const { label, closable, onClose } = props;
    
    // Определяем количество выбранных элементов
    const selectedValues = Array.isArray(value) ? value : [];
    const shouldShorten = shouldShortenNames(selectedValues.length);
    
    // Отображаем полное имя или сокращенное в зависимости от количества выбранных
    const labelText = typeof label === 'string' ? label : '';
    const displayName = shouldShorten && labelText ? shortenFullName(labelText) : label;
    
    return (
      <Tag
        color="blue"
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        {displayName}
      </Tag>
    );
  };

  // Пропсы для Select
  const selectProps: SelectProps = {
    notFoundContent: loading ? <Spin size="small" /> : (notFoundContent ?? null),
    mode,
    options,
    value,
    onChange: handleChange,
    placeholder,
    disabled,
    className,
    style,
    showSearch: true,
    onSearch,
    searchValue,
    filterOption: filterOption !== undefined
      ? filterOption
      : (onSearch
        ? false
        : ((input, option) => {
            const labelText = typeof option?.label === 'string' ? option.label : '';
            return labelText.toLowerCase().includes(input.toLowerCase());
          })),
    ...restProps,
  };

  // Добавляем tagRender только для множественного выбора
  if (allowMultiple) {
    selectProps.tagRender = tagRender;
  }

  return <Select {...selectProps} />;
};

export default CustomSelect;
