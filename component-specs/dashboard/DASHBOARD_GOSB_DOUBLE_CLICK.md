# Dashboard — Двойной клик по ГОСБ для каскадного toggle

> **Цель**: Двойной клик по первой ячейке строки ГОСБ (`gosbRow`) разворачивает все вложенные уровни этого ГОСБ (сам ГОСБ + все его объекты). Повторный двойной клик — сворачивает их.

---

## Контекст

- Затрагивает: [src/pages/Dashboard.tsx](../../src/pages/Dashboard.tsx), [src/types/dashboard.ts](../../src/types/dashboard.ts).
- Базовая спека таблицы: [DASHBOARD.md](./DASHBOARD.md) — не меняется.
- Контракт хранения `expandedRowKeys` описан в [DASHBOARD_NAVIGATION.md §3](./DASHBOARD_NAVIGATION.md). Эта спека использует тот же стейт и сеттер, поэтому изменения автоматически персистятся.

---

## 1. Признак ГОСБ-строки

Сейчас в `transformDataToTableRows` ([src/pages/Dashboard.tsx](../../src/pages/Dashboard.tsx) ~стр. 194–252) `TableRow` для ГОСБ собирается без явного флага.

Добавить:

- В [src/types/dashboard.ts](../../src/types/dashboard.ts) расширить `TableRow` полем `isGosb?: boolean`.
- В `transformDataToTableRows` при создании `gosbRow` выставлять `isGosb: true`.

```ts
// в src/types/dashboard.ts
export interface TableRow {
  // ...
  isGosb?: boolean;
}
```

```ts
// в transformDataToTableRows
return {
  key: gosb.id,
  name: gosb.gosbId,
  requirements: gosbRequirements,
  cost: gosbCost,
  budget: gosbBudget,
  deviation: gosbDeviation,
  deviationPercent: Number(gosbDeviationPercent),
  isGosb: true,
  children: objectRows.length > 0 ? objectRows : undefined,
};
```

> Альтернативный способ (различать по позиции в дереве) хрупок и потребует пробрасывать level — флаг проще и читается явно.

---

## 2. Область срабатывания двойного клика

- Двойной клик срабатывает **только** по первой ячейке колонки `name` строки ГОСБ — точно там, где сейчас работает одинарный клик `toggleRowExpansion`.
- Другие колонки (Потребность, Стоимость, Бюджет, Отклонение) на двойной клик не реагируют.
- На территории, объекте, проекте и итоговой строке двойной клик НЕ обрабатывается специальным образом (обычное поведение браузера / Ant Design).

---

## 3. Алгоритм каскадного toggle

### 3.1. Сбор ключей поддерева

Для конкретного ГОСБ нужны ключи:

- `gosb.id` (сама строка ГОСБ),
- `obj.id` для каждого `obj ∈ gosb.aptrBudgetObjects`.

Проекты — листья, в `expandedRowKeys` не кладутся.

В `TableRow` это соответствует:

```
descendantKeys = [gosbRow.key, ...gosbRow.children.map(c => c.key)]
```

(объекты — это `gosbRow.children`).

### 3.2. Решение «разворачивать или сворачивать»

```ts
function toggleGosbSubtree(gosbRow: TableRow, prev: string[]): string[] {
  const subtreeKeys = [
    gosbRow.key,
    ...(gosbRow.children ?? []).map((c) => c.key),
  ];
  const prevSet = new Set(prev);
  const anyExpanded = subtreeKeys.some((k) => prevSet.has(k));

  if (anyExpanded) {
    // сворачиваем все ключи поддерева
    const toRemove = new Set(subtreeKeys);
    return prev.filter((k) => !toRemove.has(k));
  }
  // разворачиваем все ключи поддерева
  return Array.from(new Set([...prev, ...subtreeKeys]));
}
```

Правило «**хотя бы один** ключ развёрнут → сворачиваем всё» удобнее, чем «все развёрнуты»: пользователь интуитивно ожидает, что двойной клик «закрывает то, что открыто».

---

## 4. Разведение single click и double click

DOM при двойном клике генерирует последовательность: `click` → `click` → `dblclick`. Чтобы одинарный клик случайно не сворачивал ГОСБ перед тем, как сработает двойной, используем паттерн с таймером.

### 4.1. Паттерн

```tsx
const SINGLE_CLICK_DELAY_MS = 250;
const singleClickTimerRef = React.useRef<number | null>(null);

const handleGosbSingleClick = (record: TableRow) => {
  if (singleClickTimerRef.current) {
    window.clearTimeout(singleClickTimerRef.current);
  }
  singleClickTimerRef.current = window.setTimeout(() => {
    singleClickTimerRef.current = null;
    toggleRowExpansion(record);
  }, SINGLE_CLICK_DELAY_MS);
};

const handleGosbDoubleClick = (record: TableRow) => {
  if (singleClickTimerRef.current) {
    window.clearTimeout(singleClickTimerRef.current);
    singleClickTimerRef.current = null;
  }
  setExpandedRowKeys((prev) => toggleGosbSubtree(record, prev));
};
```

### 4.2. Применение только к ГОСБ

Задержка 250 мс заметна для пользователя, поэтому применяем её **только** к ГОСБ-строкам. Для территории и объекта оставляем мгновенный одинарный клик.

```tsx
onCell: (record: TableRow) => {
  if (record.isProject) {
    return {
      onClick: () => navigate(`/project/${record.key}`),
      style: { cursor: "pointer" },
    };
  }
  if (record.isGosb) {
    return {
      onClick: () => handleGosbSingleClick(record),
      onDoubleClick: () => handleGosbDoubleClick(record),
      style: {
        cursor: isRowExpandable(record) ? "pointer" : undefined,
        userSelect: "none",
      },
    };
  }
  return {
    onClick: () => toggleRowExpansion(record),
    style: isRowExpandable(record) ? { cursor: "pointer" } : undefined,
  };
},
```

> Если в проекте уже реализована спека [DASHBOARD_NAVIGATION.md](./DASHBOARD_NAVIGATION.md), кейс `record.isProject` уже присутствует. Здесь добавляется ветка `record.isGosb`.

### 4.3. Очистка таймера при размонтировании

```tsx
React.useEffect(() => {
  return () => {
    if (singleClickTimerRef.current) {
      window.clearTimeout(singleClickTimerRef.current);
    }
  };
}, []);
```

---

## 5. UX-детали

- `user-select: none` на ячейке ГОСБ — чтобы двойной клик не выделял текст названия ГОСБ.
- Курсор `pointer` сохраняется (как сейчас для разворачиваемых строк).
- Стандартный chevron Ant Design (раскрытие через колонку expand) продолжает работать независимо — клик по нему сворачивает/разворачивает только сам ГОСБ (без потомков). Это ОК: пользователь имеет два варианта — точечный (chevron) и каскадный (двойной клик).

---

## 6. Acceptance Criteria

1. Двойной клик по первой ячейке свернутой строки ГОСБ разворачивает:
   - сам ГОСБ (отображает его объекты),
   - все его объекты (отображает потребности каждого объекта).
2. Двойной клик по первой ячейке ГОСБ, у которого развёрнут хотя бы один уровень, сворачивает весь его поддерев (сам ГОСБ + все объекты исчезают из `expandedRowKeys`).
3. Одинарный клик по первой ячейке ГОСБ работает с задержкой ~250 мс и сворачивает/разворачивает **только** сам ГОСБ (как раньше). При успевшем двойном клике одинарный отменяется.
4. Двойной клик по другим колонкам строки ГОСБ (Потребность / Стоимость / Бюджет / Отклонение) не выполняет каскадный toggle.
5. Двойной клик по строкам территории / объекта / проекта / итоговой строки не имеет специального поведения.
6. Текст названия ГОСБ не выделяется при двойном клике (`user-select: none`).
7. Состояние, выставленное каскадным toggle, сохраняется в `sessionStorage` и переживает переход на mock-страницу проекта + browser back.
8. Размонтирование `Dashboard` отменяет висящий single-click timer (нет варнингов «state update on unmounted component»).
