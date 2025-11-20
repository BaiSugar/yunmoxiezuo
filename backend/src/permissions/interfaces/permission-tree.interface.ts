export interface PermissionTreeNode {
  id: number;
  parentId: number | null;
  name: string;
  code: string;
  type: string;
  resource: string | null;
  method: string | null;
  description: string | null;
  children?: PermissionTreeNode[];
}

