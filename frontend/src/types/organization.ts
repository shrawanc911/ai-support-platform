export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
}
