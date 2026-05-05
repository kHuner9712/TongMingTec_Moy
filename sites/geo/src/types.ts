export interface LeadFormData {
  companyName: string;
  brandName: string;
  website: string;
  industry: string;
  targetCity: string;
  competitors: string;
  contactName: string;
  contactMethod: string;
  notes: string;
}

export interface LeadSubmission extends LeadFormData {
  submittedAt: string;
}

export interface FieldDef {
  name: keyof LeadFormData;
  label: string;
  placeholder: string;
  required: boolean;
  type: "text" | "url";
  span: 1 | 2;
}
