export interface ApiCertification {
  id?: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
} 