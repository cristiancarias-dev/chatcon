import { request } from "./http";
import type { CompanyRead, CompanyUpdate } from "../types";

export const companyService = {
  getMyCompany(): Promise<CompanyRead | null> {
    return request("/company/me");
  },

  updateMyCompany(data: CompanyUpdate): Promise<CompanyRead | null> {
    return request("/company/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
