import { apiRequest } from "./api";

interface CreateOrganizationRequest {
  name: string;
  slug: string;
}

interface CreateOrganizationResponse extends CreateOrganizationRequest {
  id: string;
  created_at: string;
}

export async function getOrganizationsList() {
  return apiRequest<any>(`/organizations/get_list`);
}

export async function createOrganization(data: CreateOrganizationRequest) {
  return apiRequest<CreateOrganizationResponse>("/organizations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
