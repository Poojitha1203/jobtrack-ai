import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Modal, ModalFooter } from '../ui/Modal.tsx';
import { TextField } from '../ui/TextField.tsx';
import { TextAreaField } from '../ui/TextAreaField.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { ApiError } from '../../services/api.ts';
import { createCompany, updateCompany } from '../../services/companies.ts';
import {
  changedCompanyFields,
  toCompanyFormValues,
  toCompanyInput,
  validateCompanyForm,
  type CompanyFormErrors,
  type CompanyFormValues,
} from '../../lib/companyForm.ts';
import type { Company } from '../../types/company.ts';

interface CompanyFormModalProps {
  open: boolean;
  company?: Company;
  onClose: () => void;
  onSaved: (company: Company, mode: 'created' | 'updated') => void;
}

function CompanyForm({ company, onClose, onSaved }: Omit<CompanyFormModalProps, 'open'>) {
  const [initial] = useState(() => toCompanyFormValues(company));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<CompanyFormErrors>({});
  const [saving, setSaving] = useState(false);

  const bind = (key: keyof CompanyFormValues) => ({
    value: values[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value })),
    error: errors[key],
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateCompanyForm(values);
    setErrors(validation);
    if (Object.values(validation).some(Boolean)) return;

    setSaving(true);
    try {
      if (company) {
        const changes = changedCompanyFields(toCompanyInput(values), toCompanyInput(initial));
        if (Object.keys(changes).length === 0) {
          onClose();
          return;
        }
        onSaved(await updateCompany(company.id, changes), 'updated');
      } else {
        onSaved(await createCompany(toCompanyInput(values)), 'created');
      }
    } catch (error) {
      setSaving(false);
      if (error instanceof ApiError && error.details) {
        setErrors(Object.fromEntries(Object.entries(error.details).map(([k, v]) => [k, v[0]])));
      } else {
        setErrors({ _form: error instanceof Error ? error.message : 'Could not save the company' });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5 px-6 py-5">
        {errors._form && <Alert tone="error">{errors._form}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Company name *" maxLength={150} autoFocus className="sm:col-span-2" {...bind('name')} />
          <TextField label="Website" type="url" placeholder="https://" {...bind('website')} />
          <TextField label="Industry" placeholder="e.g. Fintech" maxLength={100} {...bind('industry')} />
          <TextField label="Location" placeholder="e.g. Bengaluru" maxLength={150} className="sm:col-span-2" {...bind('location')} />
        </div>
        <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <TextField label="Contact person" placeholder="Recruiter or hiring manager" maxLength={100} {...bind('contactName')} />
          <TextField label="Contact email" type="email" maxLength={254} {...bind('contactEmail')} />
          <TextAreaField label="Notes" rows={4} maxLength={5000} className="sm:col-span-2" {...bind('notes')} />
        </div>
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {company ? 'Save changes' : 'Add company'}
        </Button>
      </ModalFooter>
    </form>
  );
}

export function CompanyFormModal({ open, company, onClose, onSaved }: CompanyFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={company ? 'Edit company' : 'Add company'} size="lg">
      <CompanyForm company={company} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}
