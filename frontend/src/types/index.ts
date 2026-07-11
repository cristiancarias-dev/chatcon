// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// ── Company ───────────────────────────────────────────────────────────────────
export interface CompanyCreate {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface CompanyUpdate {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  is_active?: boolean | null;
}

export interface CompanyRead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── User ──────────────────────────────────────────────────────────────────────
export interface UserCreate {
  email: string;
  password: string;
  name: string;
  company_id?: number | null;
}

export interface UserUpdate {
  email?: string | null;
  name?: string | null;
  is_active?: boolean | null;
  is_superuser?: boolean | null;
  password?: string | null;
  company_id?: number | null;
}

export interface RoleRef {
  id: number;
  name: string;
  description: string;
}

export interface CompanyRef {
  id: number;
  name: string;
}

export interface UserRead {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  is_superuser: boolean;
  company_id: number | null;
  created_at: string;
}

export interface UserWithRoles extends UserRead {
  roles: RoleRef[];
  company: CompanyRef | null;
}

// ── Role / Permission ─────────────────────────────────────────────────────────
export interface PermissionRead {
  id: number;
  codename: string;
  description: string;
}

export interface RoleCreate {
  name: string;
  description?: string;
}

export interface RoleUpdate {
  name?: string | null;
  description?: string | null;
}

export interface RoleRead {
  id: number;
  name: string;
  description: string;
}

export interface RoleWithPermissions extends RoleRead {
  permissions: PermissionRead[];
}

export interface RolePermissionsUpdate {
  permission_ids: number[];
}

// ── Contact ───────────────────────────────────────────────────────────────────
export interface AgentRef {
  id: number;
  name: string;
  email: string;
}

export interface ContactCreate {
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  assigned_agent_id?: number | null;
}

export interface ContactUpdate {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  avatar_url?: string | null;
  is_active?: boolean | null;
  assigned_agent_id?: number | null;
}

export interface ContactRead {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  avatar_url: string | null;
  is_active: boolean;
  assigned_agent_id: number | null;
  assigned_at: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_agent: AgentRef | null;
}

export interface ContactAssign {
  agent_id: number | null;
}

// ── Conversation ──────────────────────────────────────────────────────────────
export interface ConversationCreate {
  contact_id: number;
  assigned_agent_id?: number | null;
  whatsapp_account_id?: number | null;
}

export interface ConversationStatusUpdate {
  status: string;
}

export interface ConversationUpdate {
  whatsapp_account_id?: number | null;
}

export interface ConversationRead {
  id: number;
  contact_id: number;
  contact_name: string | null;
  contact_phone: string | null;
  assigned_agent_id: number | null;
  whatsapp_account_id: number | null;
  status: string;
  message_count: number;
  unread_count: number;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail {
  id: number;
  contact_id: number;
  contact_name: string;
  contact_phone: string;
  assigned_agent_id: number | null;
  whatsapp_account_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// ── Message ───────────────────────────────────────────────────────────────────
export interface MessageCreate {
  content: string;
  message_type?: string;
  template_name?: string | null;
  template_params?: string[] | null;
}

export interface MessageRead {
  id: number;
  conversation_id: number;
  sender_type: string;
  content: string;
  message_type: string;
  template_name: string | null;
  is_read: boolean;
  whatsapp_status?: string | null;
  whatsapp_message_id: string | null;
  whatsapp_error_code: number | null;
  whatsapp_error_message: string | null;
  created_at: string;
}

// ── WhatsApp Account ──────────────────────────────────────────────────────────
export interface WhatsAppAccountCreate {
  name: string;
  phone_number_id: string;
  phone_number: string;
  business_account_id?: string | null;
  access_token: string;
  api_version?: string;
  is_active?: boolean;
  default_template_name?: string | null;
}

export interface WhatsAppAccountUpdate {
  name?: string | null;
  phone_number_id?: string | null;
  phone_number?: string | null;
  business_account_id?: string | null;
  access_token?: string | null;
  api_version?: string | null;
  is_active?: boolean | null;
  default_template_name?: string | null;
}

export interface WhatsAppAccountRead {
  id: number;
  name: string;
  phone_number_id: string;
  phone_number: string;
  business_account_id: string | null;
  default_template_name: string | null;
  access_token_preview: string;
  api_version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── WhatsApp Template ─────────────────────────────────────────────────────────
export interface WhatsAppTemplateCreate {
  name: string;
  language?: string;
  category?: string;
  components?: Record<string, any>[];
}

export interface WhatsAppTemplateRead {
  id: number;
  account_id: number;
  name: string;
  language: string;
  category: string;
  status: string;
  meta_template_id: string | null;
  components: string | null;
  created_at: string;
  updated_at: string;
}

// ── Utility ───────────────────────────────────────────────────────────────────
export interface PaginationParams {
  skip?: number;
  limit?: number;
  search?: string;
  status?: string;
}
