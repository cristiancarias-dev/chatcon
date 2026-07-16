import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./auth/Login";
import Register from "./auth/Register";
import Dashboard from "./dashboard/Dashboard";
import NotFound from "./not-found/NotFound";
import UserList from "./users/UserList";
import UserCreate from "./users/UserCreate";
import UserEdit from "./users/UserEdit";
import RoleList from "./roles/RoleList";
import RoleCreate from "./roles/RoleCreate";
import RoleEdit from "./roles/RoleEdit";
import ContactList from "./contacts/ContactList";
import ContactCreate from "./contacts/ContactCreate";
import ContactEdit from "./contacts/ContactEdit";
import ConversationInbox from "./conversations/ConversationInbox";
import WhatsAppAccountList from "./whatsapp-accounts/WhatsAppAccountList";
import WhatsAppAccountCreate from "./whatsapp-accounts/WhatsAppAccountCreate";
import WhatsAppAccountEdit from "./whatsapp-accounts/WhatsAppAccountEdit";
import WhatsAppTemplateList from "./whatsapp-accounts/WhatsAppTemplateList";
import WhatsAppTemplateCreate from "./whatsapp-accounts/WhatsAppTemplateCreate";
import WhatsAppTemplateEdit from "./whatsapp-accounts/WhatsAppTemplateEdit";
import CompanySettings from "./company/CompanySettings";
import Layout from "./shared/Layout";
import ProtectedRoute from "./shared/ProtectedRoute";

function ProtectedLayout({ children, requireAdmin = false }) {
  return (
    <ProtectedRoute requireAdmin={requireAdmin}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedLayout>
              <ContactList />
            </ProtectedLayout>
          }
        />
        <Route
          path="/contacts/new"
          element={
            <ProtectedLayout requireAdmin>
              <ContactCreate />
            </ProtectedLayout>
          }
        />
        <Route
          path="/contacts/:id/edit"
          element={
            <ProtectedLayout requireAdmin>
              <ContactEdit />
            </ProtectedLayout>
          }
        />
        <Route
          path="/conversations"
          element={
            <ProtectedLayout>
              <ConversationInbox />
            </ProtectedLayout>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedLayout requireAdmin>
              <UserList />
            </ProtectedLayout>
          }
        />
        <Route
          path="/users/new"
          element={
            <ProtectedLayout requireAdmin>
              <UserCreate />
            </ProtectedLayout>
          }
        />
        <Route
          path="/users/:id/edit"
          element={
            <ProtectedLayout requireAdmin>
              <UserEdit />
            </ProtectedLayout>
          }
        />
        <Route
          path="/whatsapp-accounts"
          element={
            <ProtectedLayout requireAdmin>
              <WhatsAppAccountList />
            </ProtectedLayout>
          }
        />
        <Route
          path="/whatsapp-accounts/new"
          element={
            <ProtectedLayout requireAdmin>
              <WhatsAppAccountCreate />
            </ProtectedLayout>
          }
        />
        <Route
          path="/whatsapp-accounts/:id/edit"
          element={
            <ProtectedLayout requireAdmin>
              <WhatsAppAccountEdit />
            </ProtectedLayout>
          }
        />
        <Route
          path="/whatsapp-accounts/:id/templates"
          element={
            <ProtectedLayout requireAdmin>
              <WhatsAppTemplateList />
            </ProtectedLayout>
          }
        />
        <Route
          path="/whatsapp-accounts/:id/templates/new"
          element={
            <ProtectedLayout requireAdmin>
              <WhatsAppTemplateCreate />
            </ProtectedLayout>
          }
        />
        <Route
          path="/whatsapp-accounts/:id/templates/:templateId/edit"
          element={
            <ProtectedLayout requireAdmin>
              <WhatsAppTemplateEdit />
            </ProtectedLayout>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedLayout requireAdmin>
              <RoleList />
            </ProtectedLayout>
          }
        />
        <Route
          path="/roles/new"
          element={
            <ProtectedLayout requireAdmin>
              <RoleCreate />
            </ProtectedLayout>
          }
        />
        <Route
          path="/roles/:id/edit"
          element={
            <ProtectedLayout requireAdmin>
              <RoleEdit />
            </ProtectedLayout>
          }
        />
        <Route
          path="/settings/company"
          element={
            <ProtectedLayout requireAdmin>
              <CompanySettings />
            </ProtectedLayout>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
