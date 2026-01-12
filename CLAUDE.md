# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite demo project showcasing advanced patterns for batching API requests using TanStack Query (React Query) and Ant Design components. The project demonstrates how to handle API limitations (e.g., max 500 items per request) by automatically splitting large datasets into batches and processing them efficiently.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Core Architecture

### Tech Stack
- **React 19** with TypeScript
- **Vite** for build tooling with SWC for fast refresh
- **TanStack Query v5** for data fetching and state management
- **Ant Design v5** for UI components
- **React Router v7** for navigation

### Application Structure

```
src/
├── api/           # API functions (mock implementations)
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks (batch processing logic)
├── pages/         # Route-level components (demos)
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

### Key Patterns

#### 1. Batch Mutation Pattern (`useBatchMutation`)

Located in `src/hooks/useBatchMutation.ts`, this hook wraps `useMutation` to:
- Automatically split large arrays into chunks (default 500 items)
- Execute all batches **in parallel** using `Promise.all()`
- Track progress (0-100%)
- Aggregate results from all batches
- Handle partial failures gracefully

**When to use**: For imperative data operations (POST, PUT, DELETE) that need manual triggering.

**Example**:
```typescript
const usersBatch = useUsersBatch();
await usersBatch.mutateBatchAsync(1300_user_ids); // Automatically splits into 3 batches
```

#### 2. Batch Query Pattern (`useBatchQuery`)

Located in `src/hooks/useBatchQuery.ts`, this hook uses `useQueries` to:
- Automatically split large arrays into chunks
- Create separate cached queries for each batch
- Execute all batches **in parallel**
- Automatically refetch when items change
- Cache results per-batch for optimal reuse

**When to use**: For declarative data fetching (GET) where automatic caching and refetching are beneficial.

**Example**:
```typescript
const [userIds, setUserIds] = useState([]);
const query = useUsersBatchQuery(userIds); // Loads automatically when userIds changes
```

**Key difference from mutation**: Query results are cached by TanStack Query. If you request the same batch of IDs again, it returns cached data instead of making new API calls.

#### 3. Custom Select Component

Located in `src/components/CustomSelect.tsx`, wraps Ant Design's Select with:
- Automatic name shortening when multiple items are selected (uses initials when >3 items)
- Built-in search support
- Loading states
- Type-safe props

### Demo Pages

The application includes three demo pages accessible via the navigation:

1. **Custom Select Demo** (`/custom-select-demo`) - Demonstrates the custom select component with search and multiple selection
2. **Batch Mutation Demo** (`/batch-mutation-demo`) - Shows imperative batch processing with progress tracking
3. **Batch Query Demo** (`/batch-query-demo`) - Shows declarative batch processing with caching

### React Query Configuration

The QueryClient is configured in `src/main.tsx` with:
```typescript
{
  refetchOnWindowFocus: false,
  retry: 1,
}
```

### Important Implementation Details

#### Batching Logic
- Default batch size: **500 items**
- Batches are processed **in parallel**, not sequentially
- Example: 1300 items = 3 parallel requests (500 + 500 + 300)

#### Progress Tracking
Both batch hooks track completion progress:
```typescript
progress: number; // 0-100, updated as batches complete
```

#### Error Handling
- Partial failures are allowed - successful batches return data even if some batches fail
- Errors are collected in the `errors` array of the result
- If **all** batches fail, the first error is thrown

#### Cache Keys (useBatchQuery only)
Each batch gets a unique cache key including its contents:
```typescript
[...queryKey, 'batch', index, batch]
```
This enables granular caching - if you request the same subset of IDs later, those batches are served from cache.

## File Naming Conventions

- Components: PascalCase (e.g., `CustomSelect.tsx`)
- Hooks: camelCase with "use" prefix (e.g., `useBatchQuery.ts`)
- Pages: PascalCase (e.g., `BatchQueryDemo.tsx`)
- API functions: camelCase (e.g., `fetchUsersByIds`)

## Documentation

Detailed documentation for the batching patterns is available in:
- `docs/BATCH_MUTATION.md` - Comprehensive guide to useBatchMutation
- `docs/BATCH_QUERY.md` - Comprehensive guide to useBatchQuery

These docs include API references, examples, best practices, and performance considerations.

## TypeScript Configuration

The project uses TypeScript with three config files:
- `tsconfig.json` - Root config (references other configs)
- `tsconfig.app.json` - Application code config
- `tsconfig.node.json` - Vite config file types

## Current State

Based on git status, there are uncommitted changes to `src/pages/BatchQueryDemo.tsx`.
