export type Priority = 1 | 2 | 3 | 4;

export interface PriorityOption {
  value: Priority;
  label: string;
  description: string;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { value: 1, label: 'P1', description: '最高' },
  { value: 2, label: 'P2', description: '高' },
  { value: 3, label: 'P3', description: '中' },
  { value: 4, label: 'P4', description: '低' },
];

export const PRIORITY_LABELS: Record<Priority, string> = {
  1: 'P1 最高',
  2: 'P2 高',
  3: 'P3 中',
  4: 'P4 低',
};

export const PRIORITY_SHORT: Record<Priority, string> = {
  1: 'P1',
  2: 'P2',
  3: 'P3',
  4: 'P4',
};

export function isPriority(value: unknown): value is Priority {
  return value === 1 || value === 2 || value === 3 || value === 4;
}
