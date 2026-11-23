export interface Company {
  id: string;
  name: string;
  website: string | null;
  location: string | null;
  industry: string | null;
  contactName: string | null;
  contactEmail: string | null;
  notes: string | null;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyInput {
  name: string;
  website: string | null;
  location: string | null;
  industry: string | null;
  contactName: string | null;
  contactEmail: string | null;
  notes: string | null;
}
