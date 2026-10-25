import {
  Activity,
  BookOpen,
  Briefcase,
  Code,
  Coffee,
  Dumbbell,
  Folder,
  GraduationCap,
  Heart,
  Home,
  Music,
  Plane,
  Sparkles,
  Star,
  Target,
  Wallet,
  type LucideProps,
} from 'lucide-react-native';
import type { ComponentType } from 'react';

type TypeIcon = ComponentType<LucideProps>;

const TYPE_ICONS: Record<string, TypeIcon> = {
  activity: Activity,
  'book-open': BookOpen,
  briefcase: Briefcase,
  code: Code,
  coffee: Coffee,
  dumbbell: Dumbbell,
  folder: Folder,
  'graduation-cap': GraduationCap,
  heart: Heart,
  home: Home,
  music: Music,
  plane: Plane,
  sparkles: Sparkles,
  star: Star,
  target: Target,
  wallet: Wallet,
};

export const DEFAULT_TYPE_ICON = 'folder';

export const TYPE_ICON_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'folder', label: '默认' },
  { key: 'briefcase', label: '工作' },
  { key: 'sparkles', label: '提升' },
  { key: 'book-open', label: '阅读' },
  { key: 'dumbbell', label: '健身' },
  { key: 'heart', label: '生活' },
  { key: 'home', label: '家庭' },
  { key: 'star', label: '重要' },
  { key: 'code', label: '代码' },
  { key: 'plane', label: '旅行' },
  { key: 'coffee', label: '休息' },
  { key: 'music', label: '音乐' },
  { key: 'target', label: '目标' },
  { key: 'wallet', label: '财务' },
  { key: 'graduation-cap', label: '学习' },
  { key: 'activity', label: '运动' },
];

export function getTypeIcon(key: string | null | undefined): TypeIcon {
  if (key && TYPE_ICONS[key]) return TYPE_ICONS[key];
  return Folder;
}
