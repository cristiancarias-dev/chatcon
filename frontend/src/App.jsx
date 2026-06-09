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
