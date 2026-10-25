export type SortMode = 'priority_desc' | 'priority_asc' | 'created_asc' | 'created_desc';

export interface SortOption {
  value: SortMode;
  label: string;
}

export const DEFAULT_SORT_MODE: SortMode = 'priority_desc';

export const SORT_OPTIONS: SortOption[] = [
  { value: 'priority_desc', label: '优先级从高到低' },
  { value: 'priority_asc', label: '优先级从低到高' },
  { value: 'created_asc', label: '创建时间从远到近' },
  { value: 'created_desc', label: '创建时间从近到远' },
];

export function isSortMode(value: unknown): value is SortMode {
  return (
    value === 'priority_desc' ||
    value === 'priority_asc' ||
    value === 'created_asc' ||
    value === 'created_desc'
  );
}

export function getSortLabel(mode: SortMode): string {
  return SORT_OPTIONS.find((option) => option.value === mode)?.label ?? '排序';
}

export function getSortShortLabel(mode: SortMode): string {
  switch (mode) {
    case 'priority_asc':
      return '优先级 ↑';
    case 'created_asc':
      return '创建时间 ↑';
    case 'created_desc':
      return '创建时间 ↓';
    case 'priority_desc':
    default:
      return '优先级 ↓';
  }
}
