import { z } from 'zod';

/** Trimmed text; "" becomes null (= clear the value). */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .nullable()
    .transform((value) => (value === '' ? null : value));

/** Only http(s) links — blocks "javascript:" and other dangerous URL schemes. */
export const optionalHttpUrl = z
  .union([z.literal(''), z.url({ protocol: /^https?$/, error: 'Enter a full link starting with http:// or https://' })])
  .nullable()
  .transform((value) => (value === '' ? null : value));

export const optionalEmail = z
  .union([z.literal(''), z.email('Enter a valid email address').max(254)])
  .nullable()
  .transform((value) => (value === '' ? null : value));

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

/** Query-string value that is optional and treats "" as missing. */
export const optionalQuery = <T extends z.ZodType>(schema: T) => z.preprocess(emptyToUndefined, schema.optional());

export const withDefault = <T extends z.ZodType>(schema: T) => z.preprocess(emptyToUndefined, schema);

export const nonEmpty = (data: object) => Object.keys(data).length > 0;
