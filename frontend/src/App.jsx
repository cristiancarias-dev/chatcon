import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import UserList from "./pages/admin/UserList";
import UserCreate from "./pages/admin/UserCreate";
import UserEdit from "./pages/admin/UserEdit";
import RoleList from "./pages/admin/RoleList";
import RoleCreate from "./pages/admin/RoleCreate";
import RoleEdit from "./pages/admin/RoleEdit";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin/users" element={<UserList />} />
      <Route path="/admin/users/new" element={<UserCreate />} />
      <Route path="/admin/users/:id/edit" element={<UserEdit />} />
      <Route path="/admin/roles" element={<RoleList />} />
      <Route path="/admin/roles/new" element={<RoleCreate />} />
      <Route path="/admin/roles/:id/edit" element={<RoleEdit />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
