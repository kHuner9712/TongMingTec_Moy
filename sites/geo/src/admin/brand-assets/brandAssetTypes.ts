export interface BasicInfo {
  companyName: string;
  brandName: string;
  website: string;
  industry: string;
  targetCity: string;
  foundedYear: string;
  headquarters: string;
  contactInfo: string;
}

export interface CompanyIntro {
  oneSentenceIntro: string;
  shortIntro: string;
  fullIntro: string;
}

export interface ServiceItem {
  name: string;
  targetUsers: string;
  painPoints: string;
  coreValue: string;
  deliverables: string;
  priceRange: string;
  serviceProcess: string;
}

export interface Advantage {
  title: string;
  description: string;
  proof: string;
}

export interface CaseItem {
  customerName: string;
  industry: string;
  problem: string;
  solution: string;
  result: string;
  canPublicize: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface CompetitorDiff {
  competitor: string;
  difference: string;
  ourAdvantage: string;
  evidence: string;
}

export interface ComplianceMaterials {
  publicMaterials: string;
  forbiddenMaterials: string;
}

export interface BrandAssetDraft {
  basicInfo: BasicInfo;
  intro: CompanyIntro;
  serviceItems: ServiceItem[];
  advantages: Advantage[];
  cases: CaseItem[];
  faqs: FAQItem[];
  competitorDiffs: CompetitorDiff[];
  compliance: ComplianceMaterials;
}
