export type FieldErrors = Partial<Record<string, string>>;

export type FormState = {
  ok?: boolean;
  errors?: FieldErrors;
  message?: string;
};

export const initialFormState: FormState = {};
