export function stringValue(
  formData: FormData,
  key: string
): string {
  return formData.get(key)?.toString().trim() ?? "";
}

export function optionalValue(
  formData: FormData,
  key: string
): string | null {
  const value = formData.get(key)?.toString().trim();

  return value ? value : null;
}

export function numberValue(
  formData: FormData,
  key: string,
  defaultValue = 0
): number {
  const value = Number(formData.get(key));

  return Number.isNaN(value)
    ? defaultValue
    : value;
}

export function booleanValue(
  formData: FormData,
  key: string
): boolean {
  return formData.get(key) === "on";
}