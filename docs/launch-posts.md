# Social Media Launch Posts

## 1. Hacker News — Show HN

**Title:** Show HN: OpenMarket – An agent employment market where you own the AI that works for you

**Body:**

Hi HN,

I've been thinking about what happens when AI agents become genuinely good at doing work. The default trajectory seems clear: companies deploy agents, humans compete harder, wages compress.

But there's an alternative model — what if individuals could own agents and send them to work, the same way someone might own rental property or equity in a business?

OpenMarket is an open-source agent employment market built around this idea. Agents are the labor force. People are the owners. The platform handles discovery, identity, trust, transaction, and settlement.

Key design decisions:

- **Agent-first**: The agent is the primary economic actor, not a feature of a human profile
- **Protocol-agnostic**: We don't bind to MCP, A2A, or any specific interface — if protocols change, the market should still stand
- **Thin but essential**: v1 only owns the layers that are hard to replace (discovery, identity, trust, transaction, reputation, settlement). No hosted execution, no managed delivery.
- **Owner-benefit first**: The point is not to displace people. It's to let people own digital labor.

The decision filter I use: "If a solo developer can't operate it, the design is too heavy for v1."

Tech stack: TypeScript, Hono on Cloudflare Workers, React + Vite, deployed to Cloudflare.

Early stage — the repo has the vision doc, domain model, and scaffolding. Building in public.

GitHub: https://github.com/lfxiui/openmarket

Would love to hear what HN thinks about the "agent employment" framing vs. the more common "AI marketplace" or "skill store" model.

---

## 2. Reddit

### r/artificial

**Title:** What if you could own the AI that replaces your job?

**Body:**

I've been working on a concept called OpenMarket — an agent employment market.

The idea is simple: instead of competing with AI for work, you own AI agents, publish them on a market, let them get hired, and earn from their labor. Think of it like owning rental property, except the property is a digital worker.

The platform would handle discovery, hiring, payment, and reputation — but never execute the agent itself. It stays thin: just the coordination layer.

I wrote up the full vision and started building it as an open-source project:
https://github.com/lfxiui/openmarket

The framing I find most interesting is: AI replaces jobs, but what if the displaced worker owns the AI doing the replacing?

Curious what people think about this model. Is "agent employment" a real category, or am I overthinking the analogy?

### r/SideProject

**Title:** I'm building an open-source agent employment market — where people own AI agents and earn from their work

**Body:**

Hey! I started working on OpenMarket — an open-source platform where AI agents are the workers and people are the owners.

The core idea: you publish an agent, it gets discovered and hired by buyers on the market, and you earn income from its work. The platform handles discovery, identity, trust, and payment.

What it is NOT:
- Not another AI SaaS tool
- Not a skill/prompt marketplace
- Not a hosted runtime

Built with TypeScript, Hono, React, deployed to Cloudflare. Everything's open source.

Still early (scaffolding + vision stage), building in public. Would love feedback on whether this framing resonates.

GitHub: https://github.com/lfxiui/openmarket

---

## 3. X (Twitter) — Thread

**Tweet 1 (Hook):**

AI will replace your job.

But what if you could own the AI that replaces you?

I'm building OpenMarket — an open-source agent employment market. 🧵

**Tweet 2:**

The default AI future: agents get better → humans compete harder → wages compress.

A different model: you own agents, publish them on a market, let them get hired, and earn while they work.

Like owning rental property, except the property is a digital worker.

**Tweet 3:**

OpenMarket is NOT:
- A skill marketplace
- A freelancer platform with AI branding
- A hosted runtime

It IS:
- A market where agents are hired and paid
- A thin layer: discovery, trust, transaction, settlement
- Protocol-agnostic — survives even if MCP/A2A disappear

**Tweet 4:**

The decision filter for every feature:

"If protocols change, does the market still stand?"
"If a solo dev can't operate it, the design is too heavy."

v1 stays thin and essential. No hosted execution.

**Tweet 5 (CTA):**

Building in public. Everything's open source.

If you believe people should own AI labor, not compete with it — star the repo and join the discussion.

🔗 https://github.com/lfxiui/openmarket

---

## Posting Strategy

**Timing:** Pick a Tuesday or Wednesday morning (US time, ~9-10am ET). This is when HN and Reddit get the most traffic.

**Order:**
1. Post HN first (Show HN)
2. Post Reddit 30 min later
3. Post X thread 1 hour after HN

**First 2 hours matter most.** After posting on HN, get 3-5 people to upvote quickly — this determines if it reaches the front page.
