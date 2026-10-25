export interface TypeFormValues {
  name: string;
  icon: string;
  parentId: string | null;
}

export interface TypeFormErrors {
  name?: string;
}

export function createEmptyTypeForm(parentId: string | null = null, icon = 'folder'): TypeFormValues {
  return {
    name: '',
    icon,
    parentId,
  };
}

export function validateTypeForm(values: TypeFormValues): TypeFormErrors {
  const errors: TypeFormErrors = {};
  const name = values.name.trim();

  if (!name) {
    errors.name = '请输入类型名称';
  } else if (name.length > 20) {
    errors.name = '类型名称不能超过 20 个字符';
  }

  return errors;
}
