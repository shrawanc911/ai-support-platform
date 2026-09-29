import { apiRequest } from "./api";

export async function getOrganizationsList(){
    return apiRequest<any>(`/organizations/get_list`);
}