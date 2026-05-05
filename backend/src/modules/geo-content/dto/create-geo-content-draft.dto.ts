export class CreateGeoContentDraftDto {
  leadId?: string;
  brandAssetId?: string;
  reportId?: string;
  topicId?: string;
  planId?: string;
  title?: string;
  slug?: string;
  contentType?: string;
  targetKeyword?: string;
  targetQuestion?: string;
  targetAudience?: string;
  platform?: string;
  status?: string;
  summary?: string;
  outline?: string;
  body?: string;
  markdown?: string;
  seoTitle?: string;
  metaDescription?: string;
  tags?: string[];
  complianceChecklist?: string[];
  reviewNotes?: string;
  publishedUrl?: string;
  plannedPublishDate?: string;
  actualPublishDate?: string;
}
