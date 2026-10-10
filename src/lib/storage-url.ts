// URL of a stored upload. Kept apart from storage.ts so pages can link files without loading Worker-only code.
export const fileUrl = (key: string) => `/files/${key}`;
