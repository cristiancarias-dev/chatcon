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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/users" element={<UserList />} />
      <Route path="/users/new" element={<UserCreate />} />
      <Route path="/users/:id/edit" element={<UserEdit />} />
      <Route path="/roles" element={<RoleList />} />
      <Route path="/roles/new" element={<RoleCreate />} />
      <Route path="/roles/:id/edit" element={<RoleEdit />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
