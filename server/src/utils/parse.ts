import { z } from 'zod';
import { HttpError } from './HttpError.js';

export function parseQuery<T extends z.ZodType>(schema: T, query: unknown): z.infer<T> {
  const result = schema.safeParse(query);
  if (!result.success) {
    const details = z.flattenError(result.error).fieldErrors as Record<string, string[]>;
    throw new HttpError(400, 'Invalid query parameters', details);
  }
  return result.data;
}

export function parseId(value: unknown, entity = 'Resource'): string {
  const result = z.uuid().safeParse(value);
  if (!result.success) throw new HttpError(404, `${entity} not found`);
  return result.data;
}

export const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);


export const sanitizeSearchTerm = (value: string) => value.replace(/[,()"'\\*%:]/g, ' ').trim();
