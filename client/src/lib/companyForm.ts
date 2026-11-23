import type { Company, CompanyInput } from '../types/company.ts';

export type CompanyFormValues = Record<keyof CompanyInput, string>;
export type CompanyFormErrors = Partial<Record<keyof CompanyInput | '_form', string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function toCompanyFormValues(company?: Company): CompanyFormValues {
  return {
    name: company?.name ?? '',
    website: company?.website ?? '',
    location: company?.location ?? '',
    industry: company?.industry ?? '',
    contactName: company?.contactName ?? '',
    contactEmail: company?.contactEmail ?? '',
    notes: company?.notes ?? '',
  };
}

export function toCompanyInput(values: CompanyFormValues): CompanyInput {
  const orNull = (value: string) => value.trim() || null;
  return {
    name: values.name.trim(),
    website: orNull(values.website),
    location: orNull(values.location),
    industry: orNull(values.industry),
    contactName: orNull(values.contactName),
    contactEmail: orNull(values.contactEmail),
    notes: orNull(values.notes),
  };
}

export function changedCompanyFields(next: CompanyInput, previous: CompanyInput): Partial<CompanyInput> {
  return Object.fromEntries(
    (Object.keys(next) as (keyof CompanyInput)[]).filter((k) => next[k] !== previous[k]).map((k) => [k, next[k]]),
  );
}

export function validateCompanyForm(values: CompanyFormValues): CompanyFormErrors {
  const errors: CompanyFormErrors = {};
  if (!values.name.trim()) errors.name = 'Company name is required';
  if (values.website.trim()) {
    try {
      const url = new URL(values.website.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') errors.website = 'Link must start with http:// or https://';
    } catch {
      errors.website = 'Enter a full link, e.g. https://company.com';
    }
  }
  if (values.contactEmail.trim() && !EMAIL_PATTERN.test(values.contactEmail.trim())) {
    errors.contactEmail = 'Enter a valid email address';
  }
  return errors;
}

/** "https://www.acme.com/careers" → "acme.com" */
export function displayDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
