---
title: '在1986找到2026年多智能体编排的正确打开方式：为什么OTP是更好的运行时'
description: '当我们谈论 Agent Framework 时，讨论几乎总是围绕 SDK 设计、Tool Schema、Prompt 结构展开。但拆解 OpenClaw 和 Hermes 的源码后会发现，这两个系统最复杂的部分根本不在这些地方——它们把大量工程花在了进程调度、状态所有权、故障隔离和重启恢复上。这些恰好是 OTP 在 1986 年就已经解决的问题。本文从这两个生产级 Agent 系统出发，论证多智能体编排本质上就是 Actor 问题，而 OTP 是它的原生运行时。'
pubDate: '2026-04-13'
tags:
  - 智能体
  - 科技考古
original: true
heroImage: "cover.jpg"
---

## OpenClaw 和 Hermes 真正的卡点是什么

[OpenClaw](https://deepwiki.com/openclaw/openclaw) 和 [Hermes](https://deepwiki.com/NousResearch/hermes-agent) 是两个在生产环境中运行的多智能体编排系统。如果你曾使用过诸如 Claude Code、Cursor 之类的 AI 编程工具，或者用 OpenAI Responses API / LangChain 搭过多轮对话 Agent，它们实质上面临的都是同一类核心诉求：让 AI Agent 能长时间运行、管理多轮对话状态、调用工具、派生子任务。

### OpenClaw：在应用层手搓出来的控制平面

OpenClaw 的 Gateway 会按 `session key` 串行化运行，必要时再走一道全局 Lane（并发通道）做整体限流；Streaming 之前先拿 `session` 写锁；入站消息还可以自己选队列策略，比如 `steer`、`followup`、`collect`、`steer-backlog`。其对 Sub-Agent 的抽象，实质上已经无限趋近于一套真正的运行时：子 Agent 以后台任务的形式执行，跑在各自独立的 session 里，有专门的 Subagent Lane，也有一条通知链把结果一路回传给发起方。每个 “agent” 都有自己的工作区、`agentDir` 和 session 存储。

在 `command-queue.ts` 里，lane 状态里面杂糅了 queue、`activeTaskIds`、`maxConcurrent`、排空标志、代际计数器。它把队列运行时状态挂在 `globalThis` 上，好让 code-splitting 之后的不同 chunk 还能共用同一套 lane 和计数器；同时还暴露了 `resetAllLanes()`，专门处理类似 `SIGUSR1` 的进程内重启场景，免得被打断的任务留下过期的 `activeTaskIds`，把 draining 永久卡死。这显然已经不再是普通的框架代码了——它本质上是在应用层生硬地手搓出了一整套本地调度、故障恢复和重启善后的逻辑。

甚至连 Stream 的组装逻辑，也不可避免地向着应用层溢出：在 `pi-embedded-subscribe.ts` 里，OpenClaw 得自己对 Provider Stream 做归一化，因为这些 Stream 在事实上既无法保证严格的 Exactly-once（只发一次），也不保证绝对有序：`text_end` 可能会重复整段内容，甚至可能比 `message_end` 还晚到。2026 年 3 月那个关于 code-splitting 导致队列状态在多个 chunk 之间重复的 issue 也很能说明问题——当前挂在 `globalThis` 上的单例（Singleton），本质上就是对这类失败模式的一次加固。那个具体 bug 修没修不重要，重要的是 OpenClaw 竟然需要防 Bundler 行为把进程内调度状态搞坏。

### Hermes：围着一个核心对象一圈圈长出来的编排层

Hermes 则是从另一个方向，殊途同归地撞上了同一块暗礁————按它自己的架构文档，`run_agent.py` 里是一个大约 9200 行的 `AIAgent`，`gateway/run.py` 是一个大约 7500 行的消息分发器，`cli.py` 是一个大约 8500 行的 UI 入口。同一份文档还描述了一个长期运行的消息网关：14 个平台适配器、统一的 Session 路由、Cron 定时，以及一个会被 CLI、Gateway、ACP、Batch、API Server 共同复用的平台无关 `AIAgent`。

这种架构上的向心力是理解其系统瓶颈的核心所在——Hermes 的`AIAgent` 要负责 prompt 组装、provider/API 模式选择、可中断的模型调用、带线程池并发的工具执行、重试和回退切换、迭代预算以及持久化。Library 文档更进一步：`chat()` 在对象内部直接拥有完整的对话循环，tool call、重试、回退全在里面；而且文档明确警告，开发者必须为每个线程或任务新建一个 `AIAgent`，因为对象内部状态不是线程安全的，不能共享。

于是围绕这个对象，系统自然会衍生出一圈补偿机制。Gateway Runner 维护着 `_running_agents`、`_pending_messages` 这样的可变 map，又在锁后面藏了一个 `_agent_cache`，用来跨轮次保住 prompt 缓存。session 持久化放在 `~/.hermes/state.db`，用的是 SQLite WAL mode——多个读、一个写，再用 `parent_session_id` 把分裂出来的 session 串成链。这些补偿机制的存在本身就是信号：底层运行时缺失的能力，正被迫由应用层以打补丁的方式一点点向上填坑。

Cron 和异步桥接也指向同一个问题。Hermes 的 Gateway 文档说调度器每 60 秒 tick 一次；但看代码会发现，这些 tick 来自一个后台线程，用文件锁保证多个重叠进程里同一时间只有一个 tick 在跑。到期的 job 会新建 `AIAgent`，Cron 这条执行路径把整个对话扔进一个单 Worker 的线程池。在 `model_tools.py` 里，Hermes 还要给主线程和 Worker 线程各自维持持久事件循环，避免缓存下来的异步客户端报 `event loop is closed`。这些都是本该由运行时承担的工作被无奈地悉数推给了应用层。

最能看出架构边界的，是 Delegation。Hermes 的 Delegation 文档里写得很清楚：`delegate_task` 会生成拥有隔离上下文和独立 Terminal Session 的子 `AIAgent`，但最多只允许通过 `ThreadPoolExecutor` 并发三个子进程，不支持嵌套委派，而且父进程一旦被中断，所有子进程也会一起被打断。它有一个公开的架构Issue，讲得更直白：Hermes 现在本质上还是”一个 Agent 外加若干一次性 Child Agent”，并不是真正的多 A
gent 运行时；目标状态则是 DAG、agent 间协作、崩溃恢复、卡死检测、重试、健康监控。另一个 2026 年的 Bug 报告也提到过，UI 线程和 agent 线程之间有未加保护的共享可变状态。

## 这实质上暴露了怎样的问题

它们真正在底层暴露的其实是一个更为古老、也更硬核的系统工程困境：用户、平台、调度器的异步入站；会跨越很多轮 model/tool 交互的长期任务；必须被某处拥有的状态；取消；部分失败；背压；以及多个并发单元之间的消息传递。所以这两个代码库才会在队列、session 所有权、线程/任务管理、重启行为上耗费如此高昂的工程代价。

Anthropic 官方的表述在很大程度上也印证了这一判断：它在 agent-evals 的工程文章里把 agent 运行框架定义为”处理输入、编排 tool call 并返回结果的系统”；在 2026 年 3 月那篇关于长时运行应用开发的文章里，它描述了一套 planner / generator / evaluator 组成的 3-Agent 架构，用来支撑持续数小时的自主编程会话。从头到尾这都是运行时层面的问题，与 SDK 表层的接口封装其实并无太大干系。

在传统的Web系统里，最核心的架构单元是 Request Handler，其生命周期往往极短。长期任务往往是外挂的：Queue、Cron、WebSocket Consumer、Background Worker、Thread Pool。

而在多智能体编排场景中这个关系反过来了。系统的核心单元变成了那个长期持有会话状态、持续接收消息、并且可以独立失败的状态拥有者。当这一组件实质上成为架构中心时，底层运行时的模型设计便远比 SDK 的接口设计重要得多。

## OTP 实质上重塑了什么

Erlang 是 Ericsson 在 1986 年为电信交换机开发的语言——那是一类需要并发处理几十万通电话、单个通话出错不能波及其他通话、而且不能停机升级的系统。OTP（Open Telecom Platform）是 Erlang 配套的运行时框架和设计模式集合，名字虽然带 Telecom，但它抽象出来的问题是通用的：并发单元的生命周期管理、故障隔离、进程间通信。BEAM 是 Erlang 和 Elixir 共用的虚拟机。这里说的”进程”跟 OS 进程不是一回事，而是一种极度轻量化的用户态执行单元————1个 BEAM 节点可以跑几十万个，每个进程有自己独立的堆内存和 GC，进程之间只通过消息通信，不共享内存。Elixir 是 2012 年出现的语言，跑在 BEAM 上，所有并发和容错能力都直接来自 Erlang/OTP。

OTP 是一整套把并发系统组织成由 Supervisor 管理的进程的运行时和设计原语。Erlang 的设计原则文档把 Supervision Tree（监督树）放在中心位置：Supervisor 进程负责监控它下面的 Worker 进程，Worker 挂了就按预设策略重启——可以只重启挂掉的那一个，也可以重启同一组所有 Worker。进程通过各自的 Mailbox 通信，运行时保证同一发送方发来的消息顺序。

这些原语和当下 Agent Platform 的真实诉求，展现出了令人惊异的契合度：`GenServer` 是最基本的有状态进程封装——独占自己的状态，只通过收发消息和外界交互。`handle_call/3` 处理同步请求，调用方阻塞等回复，”等回复”本身就是天然的背压；`handle_cast/2` 处理异步发后即忘；`handle_info/2` 接收其他来源的消息，包括被监控进程挂掉时发来的 `:DOWN` 通知。`DynamicSupervisor` 按需启动子进程，`Task.Supervisor` 管理短命任务。link 是双向绑定，一个挂了另一个跟着挂；monitor 是单向观察，只收通知不跟着死。

这套模型里最重要的体现在状态的所有权——谁拥有状态、谁负责回收，至于表层是使用 spawn 还是 await 语法反而显得无足轻重了。进程默认隔离，不共享状态；消息进入 mailbox；supervisor 负责重启失败的进程。将此与前文提及的 Hermes 开发者警告相对照，差距便一目了然：Hermes 需要提醒开发者每个线程或任务都得新建 `AIAgent`，因为对象内部状态共享不安全；OTP 里隔离就是默认执行模型，不需要靠编码习惯来维持。

因此，两者之间的对应关系显得异常直白且纯粹。在一个 OTP 形状的 Agent Platform 里：session 是进程，收件箱是 mailbox，tool call 是由 Supervisor 管理的 task，sub-agent 是动态子进程，超时是一条普通消息或 monitor 事件，崩溃直接交给 Supervisor 策略处理，不用在业务代码里拐出一条异常分支。从这个角度回头看，OpenClaw 的 Queue 和 Hermes 的 Thread Pool 更像是在手工重建本该由运行时提供的那一层。

## 倘若置于 Elixir 之上，这类系统应当是怎样的形态

这里不打算逐行把源文件翻译成另一种语法。真正有价值的工作，是将并发、故障边界、生命周期所有权从臃肿的应用代码中剥离，下沉回运行时本身。

**session 是进程，不是被管理的对象。** 无论是 OpenClaw 按 `session key` 串行化每次执行的 Lane Map，还是 Hermes 在 Gateway 侧维护的 `_running_agents` / `_pending_messages` / `_agent_cache`其底层逻辑其实别无二致：应用层在替运行时记录”谁还活着、谁拥有哪块状态”。在 OTP 里，每个 session key 直接对应一个按需启动的 GenServer，挂在 DynamicSupervisor 下面，通过 Registry 按 key 查找。所有入站消息路由到这个进程，串行化由”一个 mailbox + 一个状态拥有者”天然保证。OpenClaw 的 `collect`、`followup` 下沉为 session 进程内部的 mailbox 压缩和定时调度；`steer` 回归为同一个状态拥有者处理的一类控制消息。Hermes 那个巨大的一体化 `AIAgent` 则被拆散：会话所有权归 session 进程，prompt 组装逻辑变成无状态的纯模块，Gateway 侧的生命周期 Map 自然消失——状态直接住在拥有它的进程里。

**Model Run 和 Tool Call 是由 Supervisor 管理的任务。** session 进程不该直接执行 LLM 调用。它只负责拉起由 Supervisor 管理的 task 去跑模型调用和工具执行，监控它们，然后把完成或失败当普通消息收回来。这对两个系统都是一样的：OpenClaw 现在的后台任务和 Hermes 的 `ThreadPoolExecutor` 工具执行，替换为 Task.Supervisor 下的异步任务。任务挂了，session 进程收到 `:DOWN`，走正常的重试或回退路径——完全无须在业务逻辑里强行写死一条冗长且极易出错的异常捕获分支。

**Sub-Agent 和 Delegation 是动态子进程，不是并行函数调用。** OpenClaw 的 Sub-Agent 已经很接近这个形状——各自独立 session、独立 Workspace、有通知链回传结果。Hermes 的 `delegate_task` 则还伪装成一个带硬编码并发上限的函数，不支持嵌套，父进程一旦中断所有子进程跟着死。在 OTP 里，一个子 agent 就是 DynamicSupervisor 下的一个子进程。父进程 monitor 它，把完成、超时、崩溃当正常消息处理。倘使未来需要演进到真正的多 Agent 协作场景，问题会自然转变为拓扑和协议——谁可以给谁发消息、哪些 agent 共享持久状态、哪个 Supervision Tree 拥有整个 Workflow——不用往 `delegate_task` 上继续加更多 flag。

**cron 和定时调度是一个普通的调度进程。** Hermes 用”后台线程 + 文件锁 + 内联任务执行”的组合来实现 cron tick，一个卡死的任务有能力挟持整个调度循环。在 OTP 里，调度器只是一个判断什么任务到期、然后启动由 Supervisor 管理的 Job Worker 的 GenServer。某个任务卡死或崩溃，它只是某个 Supervision 域里的一次普通子进程失败，调度器本身不受影响。OpenClaw 侧也类似：那些需要定时触发的后台任务不再需要在 `globalThis` 上强行挂载丑陋的调度状态。

**真正值得注意的是哪些东西会消失。** OpenClaw 的进程全局队列状态、重启后忽略过期完成回调的代际计数器、为了救回卡死调度状态而预留的 `resetAllLanes()`————其存在的合理性都会被大幅削弱。Hermes 那条”必须为每个线程新建 AIAgent、不能共享”的告诫也自然消失，因为状态隔离来自进程隔离，不需要靠编码习惯维持。Gateway 侧手动维护的 `_running_agents` map、用文件锁保证 cron 互斥、用 SQLite WAL 串联 session 持久化——这些补偿机制的必要性同样会降低。复杂度不会凭空消失，但它会往下沉到 Supervisor 管理的进程和明确的消息协议里去。而这，恰恰才是它们本该存在的位置。

一个比较像样的监督树布局，大概会更接近这样：

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

## 这个判断的边界

OTP 显然并非解决一切问题的银弹。持久化的 session 存储、外部投递逻辑、model/provider 相关的策略仍然需要写。Provider 流仍然可能行为古怪；持久化的对话记录仍然得放在进程内存之外；面向用户的消息投递仍然需要明确的路由和重试逻辑。OTP 改变的是最难的那部分编排代码该待在哪：状态所有权、本地并发、故障隔离、消息路由、恢复逻辑——这些东西沉回运行时模型，成了原生的一部分，从而避免了在应用层无休止的手搓与妥协。

## 结语

多智能体编排，本质上就是一个 Actor 模型问题————可交互、可中断、长期运行、容易局部失败、以消息驱动为核心——这些不是某种特殊的 AI 需求，这恰恰是 Erlang 于 1986 年被创造时所直面的核心诉求。OTP 的 Process、Mailbox、Supervision Tree 是这个问题域的原生抽象，绝非某种退而求其次的平替。

OpenClaw 和 Hermes 的代码库已经把这件事证明得很清楚了。它们远不止是在包一层 model API————它们其实是在代码里重建进程所有权、Mailbox、Supervision 和重启行为。换句话说，它们已经在模仿 actor 模型和 OTP，只不过是用没有原生支持的语言在应用层重新发明了一遍蹩脚的轮子而已。