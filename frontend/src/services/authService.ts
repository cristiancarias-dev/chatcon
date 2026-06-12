import { request } from "./http";
import type { LoginRequest, Token, UserCreate, UserUpdate, UserWithRoles } from "../types";

export const authService = {
  login(data: LoginRequest): Promise<Token | null> {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  register(data: UserCreate): Promise<UserWithRoles | null> {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMe(): Promise<UserWithRoles | null> {
    return request("/users/me");
  },

  updateMe(data: UserUpdate): Promise<UserWithRoles | null> {
    return request("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
