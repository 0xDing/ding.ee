---
title: 'Finding the Right Approach to 2026 Multi-Agent Orchestration in 1986: Why OTP Is a Better Runtime'
description: 'When we talk about agent frameworks, the discussion almost always revolves around SDK design, tool schemas, prompt structure. But after dissecting the source code of OpenClaw and Hermes, you realize the most complex parts of these two systems are not in any of those areas — they pour enormous engineering effort into process scheduling, state ownership, failure isolation, and restart recovery. These happen to be exactly the problems OTP solved in 1986. Starting from these two production-grade agent systems, this article argues that multi-agent orchestration is fundamentally an Actor problem, and OTP is its native runtime.'
pubDate: '2026-04-13'
tags:
  - Agent
  - Tech Archaeology
heroImage: "cover.jpg"
original: false
---

## What OpenClaw and Hermes Are Really Stuck On

[OpenClaw](https://deepwiki.com/openclaw/openclaw) and [Hermes](https://deepwiki.com/NousResearch/hermes-agent) are two multi-agent orchestration systems running in production. If you have ever used AI coding tools like Claude Code or Cursor, or built multi-turn conversation agents with the OpenAI Responses API or LangChain, they all fundamentally face the same class of core demand: letting AI agents run for extended periods, managing multi-turn conversation state, invoking tools, and spawning sub-tasks.

### OpenClaw: A Control Plane Hand-Built at the Application Layer

OpenClaw's gateway serializes runs per `session key`, optionally passing them through a global lane for overall rate-limiting; it acquires a `session` write lock before streaming; and inbound messages can choose their own queue policies, such as `steer`, `followup`, `collect`, and `steer-backlog`. Its sub-agent abstraction has, in practice, converged on something very close to a real runtime: child agents execute as background tasks in their own independent sessions, with a dedicated subagent lane and a notification chain that propagates results all the way back to the requester. Each "agent" has its own workspace, `agentDir`, and session store.

In `command-queue.ts`, lane state bundles together a queue, `activeTaskIds`, `maxConcurrent`, a draining flag, and a generation counter. It keeps queue runtime state on `globalThis` so that code-split chunks can share the same set of lanes and counters; it also exposes `resetAllLanes()`, specifically for handling `SIGUSR1`-style in-process restart scenarios, to prevent interrupted tasks from leaving stale `activeTaskIds` that permanently block draining. This is clearly no longer ordinary framework code — it is essentially an entire suite of local scheduling, failure recovery, and restart hygiene logic crudely hand-built at the application layer.

Even stream assembly inevitably spills upward into the application layer: in `pi-embedded-subscribe.ts`, OpenClaw has to normalize provider streams itself, because these streams in practice guarantee neither strict exactly-once delivery nor perfect ordering — `text_end` can duplicate entire content blocks and may even arrive after `message_end`. The March 2026 issue about code-splitting causing queue state duplication across chunks is equally telling — the current `globalThis` singleton is essentially a hardening response to this class of failure. Whether that specific bug is fixed does not matter; what matters is that OpenClaw had to defend process-local scheduler state against bundler behavior at all.

### Hermes: An Orchestration Layer Grown Ring by Ring Around a Core Object

Hermes reaches the same reef from a different direction — according to its own architecture docs, `run_agent.py` contains a roughly 9,200-line `AIAgent`, `gateway/run.py` is a roughly 7,500-line message dispatcher, and `cli.py` is a roughly 8,500-line UI entry point. The same document describes a long-running messaging gateway: 14 platform adapters, unified session routing, cron ticking, and a single platform-agnostic `AIAgent` shared by CLI, gateway, ACP, batch, and API server.

This architectural centripetal force is the key to understanding its system bottleneck — Hermes's `AIAgent` is responsible for prompt assembly, provider/API mode selection, interruptible model calls, tool execution with thread-pool concurrency, retries and fallback switching, iteration budgets, and persistence. The library documentation goes further: `chat()` directly owns the complete conversation loop inside the object — tool calls, retries, fallbacks, everything — and the documentation explicitly warns that developers must create a new `AIAgent` for each thread or task, because the object's internal state is not thread-safe and cannot be shared.

So around this object, the system naturally grows a ring of compensating mechanisms. The gateway runner maintains mutable maps like `_running_agents` and `_pending_messages`, and hides an `_agent_cache` behind a lock to preserve prompt caching across turns. Session persistence lives in `~/.hermes/state.db`, using SQLite in WAL mode — multiple readers, one writer, with `parent_session_id` chaining split sessions together. The very existence of these compensating mechanisms is itself a signal: capabilities missing from the underlying runtime are being forced upward, patched in piece by piece at the application layer.

Cron and async bridging point to the same problem. Hermes's gateway documentation says the scheduler ticks every 60 seconds; but looking at the code reveals that these ticks come from a background thread, guarded by a file lock to ensure only one tick runs at a time across overlapping processes. Due jobs construct fresh `AIAgent` instances, and the cron execution path runs the entire conversation through a single-worker thread pool. In `model_tools.py`, Hermes also has to maintain persistent event loops for both the main thread and worker threads to avoid cached async clients throwing `event loop is closed`. All of this is work that should be borne by the runtime, helplessly pushed in its entirety onto the application layer.

What most clearly reveals the architectural boundary is delegation. Hermes's delegation docs are quite explicit: `delegate_task` spawns child `AIAgent` instances with isolated context and independent terminal sessions, but allows at most three concurrent children through `ThreadPoolExecutor`, does not support nested delegation, and if the parent is interrupted all children are interrupted with it. It has a public architecture issue that is even more blunt: Hermes today is still essentially "one agent plus a few throwaway child agents," not a true multi-agent runtime; the target state is DAGs, inter-agent cooperation, crash recovery, stuck detection, retries, and health monitoring. A separate 2026 bug report also documented unprotected shared mutable state between UI and agent threads.

## What Problem Does This Actually Expose

What they truly expose underneath is an older and harder systems engineering dilemma: asynchronous ingress from users, platforms, and schedulers; long-running tasks that span many rounds of model/tool interaction; state that must be owned somewhere; cancellation; partial failure; backpressure; and message passing between concurrent units. That is why both codebases spend such enormous engineering effort on queues, session ownership, thread/task management, and restart behavior.

Anthropic's official statements largely confirm this judgment: in its agent-evals engineering writeup, it defines the agent harness as "the system that processes inputs, orchestrates tool calls, and returns results"; in its March 2026 article on long-running application development, it describes a three-agent planner/generator/evaluator architecture for supporting multi-hour autonomous coding sessions. From start to finish, this is a runtime-level problem, with little real connection to the surface-level interface wrapping of SDKs.

In traditional web systems, the most core architectural unit is the request handler, whose lifecycle is typically extremely short. Long-running work is usually bolted on: queues, cron, WebSocket consumers, background workers, thread pools.

In multi-agent orchestration, this relationship is inverted. The core unit of the system becomes the stateful owner that holds conversation state long-term, continuously receives messages, and can fail independently. When this component becomes the de facto architectural center, the runtime's model design matters far more than the SDK's interface design.

## What OTP Actually Reshapes

Erlang is a language Ericsson developed in 1986 for telecom switches — a class of systems that needed to concurrently handle hundreds of thousands of phone calls, where a single call failing must not affect other calls, and where the system cannot be taken down for upgrades. OTP (Open Telecom Platform) is Erlang's companion runtime framework and design pattern collection; despite the name containing "Telecom," the problems it abstracts are universal: lifecycle management of concurrent units, failure isolation, and inter-process communication. BEAM is the virtual machine shared by Erlang and Elixir. The "processes" referred to here are not OS processes, but an extremely lightweight form of user-space execution unit — a single BEAM node can run hundreds of thousands of them, each process has its own independent heap memory and GC, and processes communicate only through messages without sharing memory. Elixir is a language that appeared in 2012, runs on the BEAM, and inherits all of its concurrency and fault-tolerance capabilities directly from Erlang/OTP.

OTP is a complete set of runtime and design primitives for organizing concurrent systems into supervisor-managed processes. Erlang's design principles documentation places the supervision tree at the center: supervisor processes are responsible for monitoring the worker processes beneath them, and when a worker crashes it is restarted according to a preset strategy — either just the crashed one, or all workers in the same group. Processes communicate through their individual mailboxes, and the runtime guarantees message ordering from the same sender.

These primitives exhibit a remarkably close fit with the real demands of today's agent platforms: `GenServer` is the most basic stateful process abstraction — it exclusively owns its state and interacts with the outside world only through sending and receiving messages. `handle_call/3` handles synchronous requests where the caller blocks waiting for a reply, and that "waiting for a reply" is itself natural backpressure; `handle_cast/2` handles asynchronous fire-and-forget; `handle_info/2` receives messages from other sources, including `:DOWN` notifications sent when a monitored process crashes. `DynamicSupervisor` starts child processes on demand, and `Task.Supervisor` manages short-lived tasks. Links are bidirectional bindings — one crashes, the other goes with it; monitors are unidirectional observation — you only receive notifications, you do not follow in death.

The most important aspect of this model lies in state ownership — who owns the state and who is responsible for reclaiming it; as for whether the surface-level syntax uses spawn or await, that is of little consequence. Processes are isolated by default, they do not share state; messages enter mailboxes; supervisors are responsible for restarting failed processes. Compare this with the Hermes developer warning mentioned earlier, and the gap is immediately clear: Hermes needs to remind developers that every thread or task must get a fresh `AIAgent` because sharing the object's internal state is unsafe; in OTP, isolation is the default execution model, not something that needs to be maintained through coding discipline.

Therefore, the correspondence between the two appears extraordinarily straightforward and pure. In an OTP-shaped agent platform: a session is a process, its inbox is a mailbox, a tool call is a supervisor-managed task, a sub-agent is a dynamic child process, a timeout is an ordinary message or monitor event, and a crash is handed directly to supervisor policy — no need to branch into an exceptional side path in business code. Seen from this angle, OpenClaw's queues and Hermes's thread pools look more like manual reconstructions of a layer that should have been provided by the runtime.

## What These Systems Should Look Like If Built on Elixir

The intent here is not to transliterate source files line by line into another syntax. The truly valuable work is to strip concurrency, failure boundaries, and lifecycle ownership out of bloated application code and sink them back down into the runtime itself.

**A session is a process, not a managed object.** Whether it is OpenClaw's lane map that serializes each run per `session key`, or Hermes's `_running_agents` / `_pending_messages` / `_agent_cache` maintained on the gateway side, the underlying logic is identical: the application layer is doing the runtime's job of tracking "who is still alive, who owns which piece of state." In OTP, each session key maps directly to a GenServer started on demand, under a DynamicSupervisor, looked up through a Registry by key. All inbound messages route to this process, and serialization is naturally guaranteed by "one mailbox + one state owner." OpenClaw's `collect` and `followup` sink down to inbox compaction and timer-driven scheduling inside the session process; `steer` reverts to being a class of control message handled by the same state owner. Hermes's monolithic `AIAgent` is then decomposed: conversation ownership goes to the session process, prompt assembly logic becomes a stateless pure module, and the gateway-side lifecycle maps naturally disappear — state simply lives in the process that owns it.

**Model runs and tool calls are supervisor-managed tasks.** The session process should not execute LLM calls directly. It is only responsible for spawning supervisor-managed tasks to run model calls and tool execution, monitoring them, and then receiving completion or failure as ordinary messages. This applies equally to both systems: OpenClaw's current background tasks and Hermes's `ThreadPoolExecutor` tool execution are replaced by async tasks under a Task.Supervisor. When a task crashes, the session process receives `:DOWN` and follows the normal retry or fallback path — entirely without needing to hard-code a lengthy and error-prone exception-catching branch in business logic.

**Sub-agents and delegation are dynamic child processes, not parallel function calls.** OpenClaw's sub-agents are already very close to this shape — each has an independent session, independent workspace, and a notification chain for propagating results. Hermes's `delegate_task`, on the other hand, still masquerades as a function with a hard-coded concurrency cap, no nesting support, and all children dying when the parent is interrupted. In OTP, a child agent is simply a child process under a DynamicSupervisor. The parent monitors it and handles completion, timeout, or crash as normal messages. If the future requires evolving toward true multi-agent cooperation, the problem naturally transforms into one of topology and protocol — who can message whom, which agents share durable state, which supervision tree owns the entire workflow — without needing to keep bolting more flags onto `delegate_task`.

**Cron and scheduled tasks are an ordinary scheduling process.** Hermes implements cron ticks with a combination of "background thread + file lock + inline task execution," where a single stuck task can hijack the entire scheduling loop. In OTP, the scheduler is just a GenServer that determines which tasks are due and then starts supervisor-managed job workers. If a task gets stuck or crashes, it is simply an ordinary child process failure within a supervision domain, and the scheduler itself is unaffected. The same applies on the OpenClaw side: background tasks that need periodic triggering no longer need to force ugly scheduling state onto `globalThis`.

**What is truly worth noting is what disappears.** OpenClaw's process-global queue state, the generation counters for ignoring stale completion callbacks after restart, the `resetAllLanes()` reserved for recovering blocked scheduling state — the rationale for their existence is substantially weakened. Hermes's admonition that "you must create a new AIAgent for every thread, no sharing" also naturally disappears, because state isolation comes from process isolation, not from coding discipline. The manually maintained `_running_agents` map on the gateway side, the file locks for cron mutual exclusion, the SQLite WAL for chaining session persistence — the necessity of these compensating mechanisms is likewise reduced. Complexity does not vanish into thin air, but it sinks downward into supervisor-managed processes and explicit message protocols. And that is precisely where it should have been all along.

A reasonably proper supervision tree layout would look roughly like this:

```text
GatewaySupervisor
├─ SessionRegistry
├─ SessionSupervisor (DynamicSupervisor)
│  └─ SessionServer (Per session key)
├─ LLMTaskSupervisor (Task.Supervisor)
├─ ToolTaskSupervisor (Task.Supervisor)
├─ SubagentSupervisor (DynamicSupervisor)
├─ CronScheduler (GenServer)
├─ CronJobSupervisor (DynamicSupervisor)
└─ AdapterSupervisor
   └─ PlatformAdapter × N
```

## The Boundaries of This Judgment

OTP is obviously not a silver bullet for everything. Durable session storage, external delivery logic, and model/provider-specific policies still need to be written. Provider streams will still behave quirkily; durable conversation transcripts still need to live outside process memory; user-visible message delivery still needs explicit routing and retry logic. What OTP changes is where the hardest orchestration code should live: state ownership, local concurrency, failure isolation, message routing, and recovery logic — these things sink back into the runtime model, becoming native parts, thus avoiding the endless hand-building and compromise at the application layer.

## Conclusion

Multi-agent orchestration is fundamentally an Actor model problem — interactive, interruptible, long-running, prone to partial failure, and message-driven at its core. These are not some special AI requirement; these are precisely the core demands Erlang was created to face in 1986. OTP's processes, mailboxes, and supervision trees are the native abstractions for this problem domain, not some second-best alternative.

OpenClaw and Hermes's codebases have already proved this quite clearly. They are far more than just wrapping a model API — they are actually reconstructing process ownership, mailboxes, supervision, and restart behavior in code. In other words, they are already imitating the Actor model and OTP, except they have reinvented a clumsy wheel at the application layer in languages without native support.
