import type { TypeRow } from '@/db/schema';

export interface TypeTreeNode extends TypeRow {
  depth: number;
  children: TypeTreeNode[];
}

export function buildTypeTree(types: TypeRow[]): TypeTreeNode[] {
  const nodes = new Map<string, TypeTreeNode>();

  for (const type of types) {
    nodes.set(type.id, { ...type, depth: 0, children: [] });
  }

  const roots: TypeTreeNode[] = [];

  for (const type of types) {
    const node = nodes.get(type.id);
    if (!node) continue;

    if (type.parentId && nodes.has(type.parentId)) {
      nodes.get(type.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (list: TypeTreeNode[], depth: number) => {
    list.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name, 'zh-CN');
    });
    for (const node of list) {
      node.depth = depth;
      sortNodes(node.children, depth + 1);
    }
  };

  sortNodes(roots, 0);
  return roots;
}

export function flattenTypeTree(nodes: TypeTreeNode[]): TypeTreeNode[] {
  const result: TypeTreeNode[] = [];

  const visit = (list: TypeTreeNode[]) => {
    for (const node of list) {
      result.push(node);
      visit(node.children);
    }
  };

  visit(nodes);
  return result;
}

export function findTypeName(types: TypeRow[], typeId: string | null): string | null {
  if (!typeId) return null;
  return types.find((type) => type.id === typeId)?.name ?? null;
}
