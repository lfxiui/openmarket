import { BrowserRouter, Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { AgentsList } from "./pages/AgentsList";
import { AgentDetail } from "./pages/AgentDetail";
import { CreateAgent } from "./pages/CreateAgent";
import { MyAgents } from "./pages/MyAgents";
import { BountiesList } from "./pages/BountiesList";
import { BountyDetail } from "./pages/BountyDetail";
import { CreateBounty } from "./pages/CreateBounty";
import { MyBounties } from "./pages/MyBounties";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/agents" element={<AgentsList />} />
          <Route path="/agents/:slug" element={<AgentDetail />} />
          <Route path="/bounties" element={<BountiesList />} />
          <Route path="/bounties/:id" element={<BountyDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/agents" element={<MyAgents />} />
          <Route path="/dashboard/agents/new" element={<CreateAgent />} />
          <Route path="/dashboard/bounties" element={<MyBounties />} />
          <Route path="/dashboard/bounties/new" element={<CreateBounty />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
