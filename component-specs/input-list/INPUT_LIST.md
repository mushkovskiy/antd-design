# Dynamic Inputs Component

## Overview

Необходимо реализовать компонент с динамическим добавлением и удалением инпутов.  
Компонент используется внутри формы и позволяет пользователю при создании сущности добавлять произвольное количество инпутов.

---

## Business Logic

Компонент должен:

- Позволять пользователю добавлять новые инпуты.
- Позволять удалять добавленные инпуты.
- Всегда содержать минимум один инпут.
- Синхронизировать значения всех инпутов с формой.
- Записывать значения в поле формы в формате `string[] | undefined`.

---

## Default State

### Начальное состояние

- Отображается один `Input`.
- В `suffix` передается иконка `PlusOutlined`.

### Когда инпутов больше одного

- У первого `Input` остается иконка `PlusOutlined`.
- У всех остальных `Input` используется иконка `DeleteOutlined`.

---

## User Interaction

### Добавление инпута

- При нажатии на `PlusOutlined`:
  - Добавляется новый `Input`.
  - Новый `Input` получает иконку `DeleteOutlined`.

### Удаление инпута

- При нажатии на `DeleteOutlined`:
  - Удаляется соответствующий `Input`.
  - Минимум один `Input` всегда должен оставаться.

---

## Architectural Requirements

### Single Responsibility Principle (SRP)

Компонент должен отвечать только за:

- отображение списка `Input`
- управление добавлением и удалением
- синхронизацию значений с формой

### Open/Closed Principle (OCP)

- `label` должен передаваться через пропсы.
- Имя поля формы (`name`) должно передаваться через пропсы.
- Компонент должен быть расширяемым без изменения внутренней логики.

---

## Props

### Пример пропсов которые может принимать компонент

```ts
interface DynamicInputsProps {
  form: FormInstance;
  name: string;
  label: string;
}
```

### Props Description

| Prop  | Type         | Description                                       |
| ----- | ------------ | ------------------------------------------------- |
| form  | FormInstance | Инстанс формы                                     |
| name  | string       | Имя поля формы, куда записывается массив значений |
| label | string       | Label для каждого Input                           |

Пропсов может быть больше, реши сам, сколько нужно и какие тебе нужны для реализации

## Form Synchronization Logic

При изменении значения любого `Input`:

1. Собираются значения всех инпутов.
2. Удаляются пустые строки.
3. В форму через `form.setFieldsValue()` устанавливается:

```ts
{ [name]: string[] | undefined }
```

Если все значения пустые — в форму записывается `undefined`.

---

## Example Usage

```tsx
import { Form, Button } from "antd";
import DynamicInputs from "./DynamicInputs";

export const TestForm = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log(values);
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <DynamicInputs form={form} name="phones" label="Phone number" />

      <Button type="primary" htmlType="submit">
        Submit
      </Button>
    </Form>
  );
};
```

---

## Expected Result

Если пользователь введет:

```ts
["123", "456", "789"];
```

В `onFinish` будет:

```ts
{
  phones: ["123", "456", "789"];
}
```

Если все поля пустые:

```ts
{
  phones: undefined;
}
```

---

## Summary

Компонент:

- Динамически управляет количеством инпутов.
- Всегда содержит минимум один инпут.
- Корректно синхронизируется с Ant Design Form.
- Соответствует SRP и OCP.
- Может переиспользоваться в любой форме.
