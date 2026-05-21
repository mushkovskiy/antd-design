# Dashboard — Эмуляция серверного поиска с авто-разворотом до проекта

> **Цель**: При вводе запроса в поле поиска эмулировать серверный поиск. Если найдено точное совпадение с проектом, автоматически развернуть таблицу до уровня этого проекта (territory → ГОСБ → object).

---

## Контекст

- Затрагивает: [src/pages/Dashboard.tsx](../../src/pages/Dashboard.tsx).
- Новые файлы: `src/hooks/useDashboardSearch.ts`.
- Базовая спека таблицы: [DASHBOARD.md](./DASHBOARD.md) — не меняется.
- Контракт хранения `expandedRowKeys` (sessionStorage с ключом `dashboard:expandedRowKeys`) описан в [DASHBOARD_NAVIGATION.md](./DASHBOARD_NAVIGATION.md). Эта спека использует **тот же** стейт `expandedRowKeys` и сеттер.

---

## 1. Поле поиска

Уже существует в `Dashboard.tsx`:

- Компонент: `<Input placeholder="Введите адрес или номер заявки" />`.
- Локальный стейт: `searchValue`.

Доработать: добавить индикатор «загрузки» (эмуляция серверного запроса) — `suffix={isSearching ? <LoadingOutlined /> : undefined}`.

---

## 2. Эмуляция серверного поиска

### 2.1. Дебаунс

- При изменении `searchValue` запускать дебаунс **300 мс**.
- По истечении дебаунса (если `searchValue.trim().length > 0`) выставлять `isSearching = true` и стартовать `setTimeout` на **400 мс** — это эмулирует latency сети.
- По истечении latency запускать алгоритм поиска (см. §3), затем выставлять `isSearching = false`.

### 2.2. Отмена

- Если `searchValue` изменился до истечения дебаунса или latency — текущий таймер отменяется (`clearTimeout`).
- Если `searchValue` стал пустым — поиск НЕ запускается, `isSearching = false`, состояние `expandedRowKeys` НЕ меняется.

### 2.3. Скелет реализации

Хук `src/hooks/useDashboardSearch.ts`:

```ts
import { useEffect, useRef, useState } from "react";
import type { Territory } from "../types/dashboard";

interface UseDashboardSearchParams {
  query: string;
  territories: Territory[];
  onMatchExpand: (ancestorKeys: string[]) => void;
}

interface UseDashboardSearchResult {
  isSearching: boolean;
  matchesCount: number | null; // null = поиск не запускался
}

const DEBOUNCE_MS = 300;
const FAKE_LATENCY_MS = 400;

export function useDashboardSearch({
  query,
  territories,
  onMatchExpand,
}: UseDashboardSearchParams): UseDashboardSearchResult {
  const [isSearching, setIsSearching] = useState(false);
  const [matchesCount, setMatchesCount] = useState<number | null>(null);
  const debounceRef = useRef<number | null>(null);
  const latencyRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (latencyRef.current) window.clearTimeout(latencyRef.current);

    const q = query.trim().toLowerCase();
    if (!q) {
      setIsSearching(false);
      setMatchesCount(null);
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      setIsSearching(true);
      latencyRef.current = window.setTimeout(() => {
        const { matches, ancestors } = findExactMatches(territories, q);
        if (ancestors.length > 0) onMatchExpand(ancestors);
        setMatchesCount(matches);
        setIsSearching(false);
      }, FAKE_LATENCY_MS);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (latencyRef.current) window.clearTimeout(latencyRef.current);
    };
  }, [query, territories, onMatchExpand]);

  return { isSearching, matchesCount };
}
```

`findExactMatches` — чистая функция в том же файле (см. §3.3).

---

## 3. Алгоритм поиска

### 3.1. Поля поиска

Согласно плейсхолдеру «Введите адрес или номер заявки» поиск ведётся по двум полям проекта (`AptrProject` из [src/types/dashboard.ts](../../src/types/dashboard.ts)):

- `project.number` — номер заявки;
- `project.address` — адрес.

### 3.2. Условие точного совпадения

Проект считается совпавшим, если выполняется хотя бы одно:

- `project.number.trim().toLowerCase() === q`, либо
- `project.address.trim().toLowerCase() === q`,

где `q = searchValue.trim().toLowerCase()`.

> Подстрочный (частичный) поиск НЕ выполняем — это требование «точное совпадение» из задачи. Если бэк потом добавит fuzzy-поиск, его будет легко надстроить.

### 3.3. Сбор предков

```ts
function findExactMatches(
  territories: Territory[],
  q: string
): { matches: number; ancestors: string[] } {
  const ancestorSet = new Set<string>();
  let matches = 0;

  for (const t of territories) {
    for (const g of t.aptrBudgetGosbs) {
      for (const o of g.aptrBudgetObjects) {
        for (const p of o.aptrProjects) {
          const number = (p.number ?? "").trim().toLowerCase();
          const address = (p.address ?? "").trim().toLowerCase();
          if (number === q || address === q) {
            matches += 1;
            ancestorSet.add(t.id);
            ancestorSet.add(g.id);
            ancestorSet.add(o.id);
          }
        }
      }
    }
  }

  return { matches, ancestors: Array.from(ancestorSet) };
}
```

> `project.id` в `expandedRowKeys` НЕ кладём — проект является листом и не имеет `children`. Ant Design в этом случае молча игнорирует ключ, но добавлять его всё равно семантически бессмысленно.

### 3.4. Обновление `expandedRowKeys`

Колбэк `onMatchExpand(ancestors)` в `Dashboard.tsx`:

```tsx
const handleMatchExpand = React.useCallback((ancestors: string[]) => {
  setExpandedRowKeys((prev) => Array.from(new Set([...prev, ...ancestors])));
}, []);
```

Важно:

- Поиск **только добавляет** ключи в `expandedRowKeys`, существующие развёрнутые узлы НЕ сворачиваются.
- Изменение `expandedRowKeys` автоматически персистится в `sessionStorage` через эффект из [DASHBOARD_NAVIGATION.md §3.3](./DASHBOARD_NAVIGATION.md).

---

## 4. UI-обратная связь

### 4.1. Индикатор загрузки

В `<Input>` поля поиска показывать спиннер на время эмуляции запроса:

```tsx
<Input
  placeholder="Введите адрес или номер заявки"
  value={searchValue}
  onChange={(e) => setSearchValue(e.target.value)}
  suffix={isSearching ? <LoadingOutlined /> : <span />}
  style={{ width: 300 }}
/>
```

### 4.2. Сообщение «ничего не найдено»

Под блоком фильтров (`<Space>`) и выше `<Table>` рендерить алерт **только** когда:

- `!isSearching` И
- `matchesCount === 0` И
- `searchValue.trim().length > 0`.

```tsx
{!isSearching && matchesCount === 0 && searchValue.trim() && (
  <Alert
    type="info"
    message="Ничего не найдено"
    showIcon
    style={{ marginBottom: 16 }}
  />
)}
```

При `matchesCount > 0` алерт не показываем — пользователь увидит результат через раскрытую таблицу.

### 4.3. Что НЕ делаем

- Не фильтруем `dataSource` — все строки остаются видимыми.
- Не подсвечиваем найденный проект (это потенциальная отдельная задача).
- Не сбрасываем `expandedRowKeys` при очистке поля — раскрытое состояние остаётся.

---

## 5. Интеграция в `Dashboard.tsx`

Псевдо-фрагмент:

```tsx
const { isSearching, matchesCount } = useDashboardSearch({
  query: searchValue,
  territories: dashboardData.content as Territory[],
  onMatchExpand: handleMatchExpand,
});
```

Хук вызывается на каждый ре-рендер `Dashboard`, но внутри сам управляет таймерами и отменой.

---

## 6. Acceptance Criteria

1. Ввод запроса в поле поиска через 300 мс простоя запускает «запрос», в `Input` появляется спиннер.
2. Через ~700 мс после последнего ввода (`300 + 400`) спиннер исчезает.
3. Если введённое значение **точно** равно `project.number` или `project.address` (без учёта регистра и пробелов по краям) — таблица автоматически разворачивается до этого проекта (territory + gosb + object развёрнуты, сам проект виден).
4. Если совпадений несколько (например, одинаковые адреса в разных территориях) — все соответствующие ветки разворачиваются.
5. Если совпадений нет — под фильтрами появляется `Alert` «Ничего не найдено».
6. Очистка поля поиска убирает спиннер и алерт; уже развёрнутые строки остаются развёрнутыми.
7. Поиск НЕ скрывает и не фильтрует строки в таблице — только разворачивает иерархию.
8. Поведение поиска не зависит от фильтров года / квартала / заказчика (они пока без логики).
9. Развёрнутое состояние, выставленное поиском, корректно сохраняется в `sessionStorage` и переживает переход на mock-страницу проекта + browser back.
