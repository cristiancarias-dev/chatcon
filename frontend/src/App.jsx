import { Route, Routes } from "react-router-dom";
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
import Layout from "./shared/Layout";

function ProtectedLayout({ children }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
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
          <ProtectedLayout>
            <ContactCreate />
          </ProtectedLayout>
        }
      />
      <Route
        path="/contacts/:id/edit"
        element={
          <ProtectedLayout>
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
          <ProtectedLayout>
            <UserList />
          </ProtectedLayout>
        }
      />
      <Route
        path="/users/new"
        element={
          <ProtectedLayout>
            <UserCreate />
          </ProtectedLayout>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <ProtectedLayout>
            <UserEdit />
          </ProtectedLayout>
        }
      />
      <Route
        path="/whatsapp-accounts"
        element={
          <ProtectedLayout>
            <WhatsAppAccountList />
          </ProtectedLayout>
        }
      />
      <Route
        path="/whatsapp-accounts/new"
        element={
          <ProtectedLayout>
            <WhatsAppAccountCreate />
          </ProtectedLayout>
        }
      />
      <Route
        path="/whatsapp-accounts/:id/edit"
        element={
          <ProtectedLayout>
            <WhatsAppAccountEdit />
          </ProtectedLayout>
        }
      />
      <Route
        path="/whatsapp-accounts/:id/templates"
        element={
          <ProtectedLayout>
            <WhatsAppTemplateList />
          </ProtectedLayout>
        }
      />
      <Route
        path="/whatsapp-accounts/:id/templates/new"
        element={
          <ProtectedLayout>
            <WhatsAppTemplateCreate />
          </ProtectedLayout>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedLayout>
            <RoleList />
          </ProtectedLayout>
        }
      />
      <Route
        path="/roles/new"
        element={
          <ProtectedLayout>
            <RoleCreate />
          </ProtectedLayout>
        }
      />
      <Route
        path="/roles/:id/edit"
        element={
          <ProtectedLayout>
            <RoleEdit />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
