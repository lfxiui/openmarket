import { BrowserRouter, Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { AgentsList } from "./pages/AgentsList";
import { CreateAgent } from "./pages/CreateAgent";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/agents" element={<AgentsList />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/agents/new" element={<CreateAgent />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
