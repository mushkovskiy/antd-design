# Dashboard — Навигация на проект и восстановление состояния таблицы

> **Цель**: По клику на строку проекта (самый вложенный уровень) переходить на mock-страницу проекта. При возврате назад через browser history таблица должна быть развёрнута до того состояния, в котором пользователь её оставил.

---

## Контекст

- Затрагивает: [src/pages/Dashboard.tsx](../../src/pages/Dashboard.tsx), [src/App.tsx](../../src/App.tsx).
- Новые файлы: `src/pages/ProjectMock.tsx`.
- Базовая спека таблицы: [DASHBOARD.md](./DASHBOARD.md) — не меняется.
- Связанные спеки (используют тот же контракт хранения `expandedRowKeys`):
  - [DASHBOARD_SEARCH.md](./DASHBOARD_SEARCH.md)
  - [DASHBOARD_GOSB_DOUBLE_CLICK.md](./DASHBOARD_GOSB_DOUBLE_CLICK.md)

---

## 1. Mock-страница проекта

### 1.1. Файл

Создать `src/pages/ProjectMock.tsx`.

### 1.2. Поведение

- Компонент рендерит только текст `mock page`.
- Стилизация не требуется (минимальный отступ контейнера допустим, чтобы текст не прилипал к шапке).
- Параметр маршрута `:id` читается через `useParams<{ id: string }>()` и НЕ обязателен для отображения, но компонент должен корректно работать без падений, если `id` отсутствует.

### 1.3. Пример реализации

```tsx
import { useParams } from "react-router-dom";

const ProjectMock = () => {
  const { id } = useParams<{ id: string }>();
  return <div style={{ padding: 24 }}>mock page (id: {id})</div>;
};

export default ProjectMock;
```

### 1.4. Маршрут

В [src/App.tsx](../../src/App.tsx) в блок `<Routes>` добавить:

```tsx
<Route path="/project/:id" element={<ProjectMock />} />
```

Импорт `ProjectMock` рядом с остальными импортами страниц. Добавлять пункт в `<Menu>` НЕ нужно — переход выполняется только из таблицы.

---

## 2. Клик по строке проекта

### 2.1. Признак строки проекта

Уже существует в [src/pages/Dashboard.tsx](../../src/pages/Dashboard.tsx): `record.isProject === true` для строк, созданных из `aptrProjects`.

### 2.2. Обработчик

В первой колонке `name` функция `onCell` должна различать тип строки:

- Для строки проекта (`record.isProject === true`):
  - `onClick` вызывает `navigate(\`/project/${record.key}\`)` (где `record.key === project.id`).
  - `style.cursor = "pointer"`.
  - Существующий `toggleRowExpansion` для проектов НЕ срабатывает (у проекта нет `children`).
- Для остальных строк (территория / ГОСБ / объект):
  - Текущая логика `toggleRowExpansion(record)` сохраняется без изменений.
  - `cursor: pointer` показывается только если `isRowExpandable(record)` (как сейчас).

### 2.3. Пример

```tsx
const navigate = useNavigate();

onCell: (record: TableRow) => {
  if (record.isProject) {
    return {
      onClick: () => navigate(`/project/${record.key}`),
      style: { cursor: "pointer" },
    };
  }
  return {
    onClick: () => toggleRowExpansion(record),
    style: isRowExpandable(record) ? { cursor: "pointer" } : undefined,
  };
},
```

### 2.4. Область клика

Переход срабатывает **только при клике по первой колонке** (`name`) — там, где сейчас навешен `toggleRowExpansion`. Остальные колонки (Потребность, Стоимость, Бюджет, Отклонение) кликами не реагируют.

---

## 3. Сохранение и восстановление развёрнутого состояния

### 3.1. Контракт хранения

Это **единый контракт** для всех фич, изменяющих `expandedRowKeys` (навигация, поиск, двойной клик).

- **Хранилище**: `sessionStorage`.
- **Ключ**: `dashboard:expandedRowKeys`.
- **Формат**: JSON-массив строк (`string[]`), сериализация через `JSON.stringify` / `JSON.parse`.

### 3.2. Инициализация стейта

Ленивая инициализация при монтировании `Dashboard`:

```tsx
const EXPANDED_KEYS_STORAGE_KEY = "dashboard:expandedRowKeys";

const [expandedRowKeys, setExpandedRowKeys] = React.useState<string[]>(() => {
  try {
    const raw = sessionStorage.getItem(EXPANDED_KEYS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === "string") : [];
  } catch {
    return [];
  }
});
```

### 3.3. Синхронизация при каждом изменении

```tsx
React.useEffect(() => {
  try {
    sessionStorage.setItem(
      EXPANDED_KEYS_STORAGE_KEY,
      JSON.stringify(expandedRowKeys)
    );
  } catch {
    // ignore quota errors
  }
}, [expandedRowKeys]);
```

### 3.4. Сценарий «открыл проект → нажал back»

1. Пользователь раскрывает таблицу до уровня проекта (territory → gosb → object).
2. Кликает по строке проекта → `navigate("/project/<id>")`.
   - На момент навигации `sessionStorage` уже содержит актуальные `expandedRowKeys` (благодаря `useEffect`).
3. На mock-странице нажимает browser back.
4. `Dashboard` монтируется заново → ленивая инициализация читает ключи из `sessionStorage` → таблица отрисовывается уже развёрнутой.

### 3.5. Почему именно `sessionStorage`

| Подход | Минусы |
|--------|--------|
| `location.state` при `navigate(...)` | При browser back React Router не пробрасывает обратно `state`, обновлённый ПОСЛЕ первоначальной навигации. Нужно либо `replace: true` на каждый toggle (мерцание истории), либо ручное хранение. |
| `window.history.replaceState` на каждый toggle | Хрупко: легко затереть state, конфликтует с React Router внутренним state, требует дополнительного слоя сериализации. |
| Глобальный стейт (Zustand/Redux) | Не переживает hard reload вкладки, добавляет зависимости ради одной фичи. |
| `sessionStorage` | Простая модель «write on change, read on mount», переживает hard reload в рамках вкладки, очищается при закрытии вкладки — это ожидаемое поведение для UI-стейта таблицы. |

### 3.6. Edge cases

- **Первая загрузка** (нет ключа в storage) → стейт инициализируется как `[]`.
- **Битый JSON / не массив** → `try/catch` возвращает `[]`.
- **Ключи несуществующих строк** (например, данные на бэке изменились) → Ant Design `Table` молча игнорирует такие ключи в `expandedRowKeys`, поведения это не ломает.
- **Открытие дашборда в новой вкладке** → `sessionStorage` per-tab, стейт начинается с пустого.
- **Quota exceeded** при записи → перехватывается `try/catch`, ошибка не пробрасывается в UI.

---

## 4. Acceptance Criteria

1. Клик по первой ячейке строки проекта переходит на `/project/<project.id>` и страница показывает текст `mock page`.
2. Клик по первой ячейке территории / ГОСБ / объекта **по-прежнему** разворачивает/сворачивает строку (поведение не сломано).
3. После клика по проекту и возврата через browser back таблица отрисована с тем же набором развёрнутых строк, что был перед уходом.
4. Hard reload (`F5`) на странице дашборда сохраняет развёрнутое состояние.
5. Открытие дашборда в новой вкладке стартует со свёрнутой таблицей.
6. Никакая другая колонка (Потребность / Стоимость / Бюджет / Отклонение) не реагирует на клик навигацией.
