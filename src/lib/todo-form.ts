export interface TodoFormValues {
  name: string;
  typeId: string | null;
  priority: 1 | 2 | 3 | 4;
  dueAt: number | null;
  detail: string;
}

export interface TodoFormErrors {
  name?: string;
  typeId?: string;
}

export function createEmptyTodoForm(): TodoFormValues {
  return {
    name: '',
    typeId: null,
    priority: 3,
    dueAt: null,
    detail: '',
  };
}

export function validateTodoForm(values: TodoFormValues): TodoFormErrors {
  const errors: TodoFormErrors = {};
  const name = values.name.trim();

  if (!name) {
    errors.name = '请输入待办名称';
  } else if (name.length > 100) {
    errors.name = '名称不能超过 100 个字符';
  }

  if (!values.typeId) {
    errors.typeId = '请选择类型';
  }

  return errors;
}
