---
title: '1986年に、2026年のマルチエージェント・オーケストレーションの正しい解き方を見つける: なぜ OTP はより良いランタイムなのか'
description: 'Agent Framework を語るとき、議論はほとんどいつも SDK 設計、Tool Schema、Prompt 構造のまわりを回る。だが OpenClaw と Hermes のソースを分解してみると、最も複雑なのはそこではない。両者が大量の工数を費やしているのは、プロセススケジューリング、状態の所有権、障害隔離、再起動後の復旧であり、まさに OTP が 1986 年の時点で解いていた問題である。本稿ではこの二つの本番級 Agent システムから出発し、マルチエージェント・オーケストレーションの本質は Actor 問題であり、OTP はそのネイティブなランタイムだと論じる。'
pubDate: '2026-04-13'
tags:
  - エージェント
  - テック考古学
original: false
heroImage: "cover.jpg"
---

## OpenClaw と Hermes の本当のボトルネックは何か

[OpenClaw](https://deepwiki.com/openclaw/openclaw) と [Hermes](https://deepwiki.com/NousResearch/hermes-agent) は、どちらも本番環境で動いているマルチエージェント・オーケストレーション・システムだ。Claude Code や Cursor のような AI コーディングツールを使ったことがある人も、OpenAI Responses API や LangChain で多ターン対話型 Agent を組んだことがある人も、結局は同じ種類の核心的な要求に向き合っている。AI Agent を長時間動かし、多ターンの会話状態を管理し、ツールを呼び出し、子タスクを派生させることだ。

### OpenClaw: アプリケーション層で手作業で組み上げられた control plane

OpenClaw の Gateway は `session key` ごとに実行を直列化し、必要に応じて全体の Lane でも並行度を制限する。Streaming の前には `session` の write lock を取得し、入ってくるメッセージには `steer`、`followup`、`collect`、`steer-backlog` のような queue policy を選ばせる。Sub-Agent 抽象も、実質的にはすでに本物のランタイムにかなり近い。子 Agent はバックグラウンドタスクとして動き、それぞれ独立した session を持ち、専用の Subagent Lane があり、結果を起点へ返すための通知チェーンまである。各 "agent" はそれぞれ独自の workspace、`agentDir`、session store を持つ。

`command-queue.ts` では、lane state の中に queue、`activeTaskIds`、`maxConcurrent`、draining flag、generation counter が雑居している。queue の runtime state は `globalThis` にぶら下げられていて、code-splitting 後の複数 chunk 間でも同じ lane と counter を共有できるようになっている。同時に `resetAllLanes()` も公開されており、`SIGUSR1` のような in-process restart の場面で、中断された task が古い `activeTaskIds` を残して draining を永久に詰まらせるのを避けている。ここまで来ると、もはや普通の framework code ではない。ローカルな scheduling、failure recovery、restart cleanup を、アプリケーション層で力ずくで再構築している。

stream の組み立てロジックでさえ、結局はアプリケーション層へ漏れ出してくる。`pi-embedded-subscribe.ts` では、Provider Stream が厳密な Exactly-once でも完全順序でもないため、OpenClaw 側で正規化しなければならない。`text_end` が本文全体を重複して運んでくることもあれば、`message_end` より後に届くことすらある。2026 年 3 月に出ていた、code-splitting によって queue state が複数 chunk に複製される issue も同じ意味で示唆的だ。現在の `globalThis` singleton は、この種の failure mode への hardening にほかならない。あの個別 bug が修正されたかどうかは本質ではない。本質は、OpenClaw が bundler の挙動から process-local scheduler state を守らなければならなかったという事実そのものにある。

### Hermes: 一つの中心 object のまわりに層状に伸びていった orchestration

Hermes は別方向から、結局は同じ暗礁にたどり着いている。自分たちの architecture document によれば、`run_agent.py` にはおよそ 9200 行の `AIAgent` があり、`gateway/run.py` にはおよそ 7500 行の message dispatcher があり、`cli.py` にはおよそ 8500 行の UI entry point がある。同じ文書は、14 個の platform adapter、統一された Session routing、Cron の定期実行、そして CLI、Gateway、ACP、Batch、API Server から共用される platform-agnostic な `AIAgent` を中心にした長寿命メッセージング Gateway も説明している。

この設計上の求心力こそが、Hermes のシステムボトルネックを理解する鍵だ。Hermes の `AIAgent` は prompt assembly、provider/API mode の選択、interruptible な model call、thread pool 並行実行付きの tool execution、retry と fallback switching、iteration budget、persistence を丸ごと背負っている。Library documentation はさらに露骨で、`chat()` が object 内部で会話ループ全体を直接所有し、tool call も retry も fallback もすべてその中に抱え込んでいる。そして開発者に対しては、thread や task ごとに新しい `AIAgent` を作らなければならないと明示的に警告している。object の内部状態は thread-safe ではなく、共有できないからだ。

するとその object の周囲には、当然のように補償メカニズムの輪が生えてくる。Gateway Runner は `_running_agents` や `_pending_messages` のような mutable map を抱え、turn をまたいで prompt cache を維持するために lock の後ろへ `_agent_cache` を置いている。session persistence は `~/.hermes/state.db` に置かれ、SQLite の WAL mode で複数 reader / 単一 writer を回しつつ、split session の lineage を `parent_session_id` でつないでいる。こうした補償メカニズムの存在そのものがシグナルだ。下のランタイムに欠けている能力を、アプリケーション層が継ぎはぎで埋め戻している。

Cron と async bridging も、同じ問題を別の角度から指している。Hermes の Gateway documentation では scheduler が 60 秒ごとに tick すると書かれているが、実装を見ると、その tick は background thread から来ており、複数 process が重なっても同時に一つしか tick しないよう file lock で守られている。期限の来た job は新しい `AIAgent` を組み立て、Cron の実行経路では会話全体を single-worker の thread pool に通す。`model_tools.py` では、cached async client が `event loop is closed` で壊れないように、main thread 用と worker thread 用に persistent event loop まで維持している。どれも本来はランタイムが担うべき仕事を、やむなくアプリケーション層へ押し上げた結果だ。

アーキテクチャの境界が最も露骨に見えるのは Delegation である。Hermes の Delegation documentation ははっきり書いている。`delegate_task` は隔離された context と独立した Terminal Session を持つ子 `AIAgent` を生成するが、`ThreadPoolExecutor` 経由で同時に走らせられるのは最大 3 つまでで、nested delegation はなく、親が interrupt されるとすべての子も巻き添えで止まる。公開されている architecture issue はさらに率直だ。Hermes は今のところ本質的には「一つの Agent と、いくつかの使い捨て Child Agent」にすぎず、真の multi-agent runtime ではない。目指す将来像は DAG、agent 間協調、crash recovery、stuck detection、retry、health monitoring だ。2026 年の別の bug report でも、UI thread と agent thread のあいだに保護されていない shared mutable state が報告されていた。

## これは実質的にどんな問題を露呈しているのか

両者が底で露呈しているのは、もっと古く、もっと硬いシステム工学の問題である。user、platform、scheduler から非同期に入ってくる ingress。複数回の model/tool interaction をまたぐ long-running task。どこかが ownership を持たなければならない state。cancellation。partial failure。backpressure。そして複数の同時実行単位のあいだの message passing。だからこそ、この二つの codebase は queue、session ownership、thread/task management、restart behavior にこれほど大きな工数を払い続けている。

Anthropic の公式な言い方も、この判断をかなり裏づけている。agent-evals に関する engineering article では、agent harness を「入力を処理し、tool call を orchestration し、結果を返すシステム」と定義しているし、2026 年 3 月の long-running application development に関する記事では、planner / generator / evaluator から成る 3-Agent architecture を使って数時間にわたる autonomous coding session を支える構図を描いている。最初から最後まで、これはランタイム層の問題であって、SDK 表面の API 設計の問題ではない。

伝統的な Web システムでは、もっとも核心的な architectural unit は Request Handler であり、その寿命はたいてい非常に短い。長寿命の仕事は普通、外付けされる。Queue、Cron、WebSocket Consumer、Background Worker、Thread Pool だ。

ところがマルチエージェント・オーケストレーションでは、この関係が逆転する。システムの中心単位は、長く会話状態を持ち続け、継続的にメッセージを受け取り、独立に失敗しうる state owner へ変わる。このコンポーネントが事実上アーキテクチャの中心物体になった時点で、SDK の surface design より、下の runtime model のほうがはるかに重要になる。

## OTP は実質的に何を作り替えるのか

Erlang は Ericsson が 1986 年に通信交換機のために作った言語である。数十万本の通話を同時に処理し、一本の通話の障害が他へ波及してはならず、しかも停止せずに更新しなければならない。OTP（Open Telecom Platform）は、それに対応して整えられたランタイム framework と design pattern の集合だ。名前には Telecom とあるが、抽象化している問題は一般的である。並行実行単位の lifecycle management、failure isolation、process 間通信だ。BEAM は Erlang と Elixir が共有する virtual machine である。ここで言う "process" は OS process とは別物で、極度に軽量な user-space execution unit だ。1 つの BEAM node で数十万単位を走らせることができ、各 process は独立した heap memory と GC を持ち、process 間は message passing だけで通信し、shared memory を持たない。Elixir は 2012 年に登場した言語で、BEAM の上で動き、並行性と耐障害性はすべて Erlang/OTP から直接受け継いでいる。

OTP は、並行システムを Supervisor 配下の process 群として組み立てるためのランタイムと設計プリミティブの一式である。Erlang の design principles documentation では Supervision Tree が中心に置かれている。Supervisor process は配下の Worker process を監視し、Worker が落ちたらあらかじめ決めた戦略に従って再起動する。落ちた一つだけを再起動することも、同じグループの Worker 全体を再起動することもできる。process 同士はそれぞれの Mailbox を通じて通信し、ランタイムは同一 sender から来た message の順序を保証する。

こうしたプリミティブは、いまの Agent Platform が本当に必要としているものと驚くほどきれいに噛み合う。`GenServer` はもっとも基本的な stateful process のカプセル化であり、自分の state を独占し、message の送受信だけで外界とやり取りする。`handle_call/3` は同期 request を処理し、呼び出し側は reply を待って block する。この「reply を待つ」こと自体が自然な backpressure になる。`handle_cast/2` は非同期 fire-and-forget を扱う。`handle_info/2` は別経路から来る message を受け取る。監視していた process が落ちたときの `:DOWN` 通知もここに入る。`DynamicSupervisor` は必要に応じて子 process を起動し、`Task.Supervisor` は短命 task を管理する。link は双方向に fate を結び、一方が落ちるともう一方も落ちる。monitor は一方向の観測で、通知だけを受け取り、自分は巻き添えで死なない。

このモデルで最も重要なのは state ownership である。誰が state を所有し、誰がそれを片づけるのか。表面上 `spawn` を使うか `await` を使うかは、そこまで重要ではない。process はデフォルトで分離され、state を共有せず、message は mailbox に入り、失敗した process は supervisor が再起動する。これを前述の Hermes 開発者向け警告と並べれば、差は一目瞭然だ。Hermes は internal state を共有すると危ないから、thread や task ごとに新しい `AIAgent` を作れと注意しなければならない。OTP では隔離は coding convention ではなく、デフォルトの execution model そのものだ。

だから両者の対応関係は、驚くほど直截で純粋になる。OTP 形の Agent Platform では、session は process であり、inbox は mailbox であり、tool call は Supervisor 管理下の task であり、sub-agent は動的な子 process であり、timeout は普通の message か monitor event であり、crash は business logic の中で迂回的に処理する例外分岐ではなく、Supervisor policy へ渡される入力になる。この観点から見直すと、OpenClaw の Queue や Hermes の Thread Pool は、本来ランタイムが提供すべき層を手で再建しているものに見えてくる。

## もし Elixir の上に置くなら、この種のシステムはどんな形になるか

ここでやるべきなのは、source file を一行ずつ別の syntax に翻訳することではない。本当に価値があるのは、concurrency、failure boundary、lifecycle ownership を肥大化した application code から剥がし、ランタイムそのものへ沈め直すことだ。

**session は process であって、管理対象の object ではない。** OpenClaw が `session key` ごとに実行を直列化する Lane Map も、Hermes が Gateway 側で維持している `_running_agents` / `_pending_messages` / `_agent_cache` も、底にある論理は同じである。アプリケーション層がランタイムの代わりに「誰がまだ生きているか」「どの state を誰が持っているか」を記録している。OTP では、各 session key は DynamicSupervisor 配下で on-demand に起動される GenServer にそのまま対応し、Registry を通じて key で引く。すべての inbound message はこの process にルーティングされる。直列化は「一つの mailbox と一人の state owner」によって自然に保証される。OpenClaw の `collect` や `followup` は session process 内の mailbox compaction と timer-based scheduling に沈み、`steer` は同じ state owner が処理する control message に戻る。Hermes の巨大で一体化した `AIAgent` は解体される。会話の ownership は session process に、prompt assembly は stateless な純粋 module に帰る。Gateway 側の lifecycle map は自然に消え、state はそれを所有する process の中にそのまま住む。

**Model Run と Tool Call は Supervisor に管理される task である。** session process 自体が LLM call を直接実行すべきではない。session process は、Supervisor 管理下の task を起動して model call や tool execution を走らせ、それらを monitor し、完了や失敗を普通の message として受け取ればよい。この構図は両システムにそのまま当てはまる。OpenClaw の現在の background task も、Hermes の `ThreadPoolExecutor` ベースの tool execution も、`Task.Supervisor` 配下の非同期 task に置き換えられる。task が落ちれば、session process は `:DOWN` を受け取り、通常の retry や fallback の経路に乗せればいい。business logic の中に冗長で壊れやすい exception branch を無理やり埋め込む必要はない。

**Sub-Agent と Delegation は動的な子 process であり、並列 function call ではない。** OpenClaw の Sub-Agent はすでにかなりこの形に近い。独立した session、独立した workspace、結果を返す通知チェーンがある。一方、Hermes の `delegate_task` は、hard-coded な並列上限を持つ function call の顔をまだしていて、nested delegation もなく、親が interrupt されると子も全部止まる。OTP では、子 agent は DynamicSupervisor 配下の子 process である。親 process はそれを monitor し、完了、timeout、crash を普通の message として扱う。将来これを本物の multi-agent collaboration に進化させる必要があるなら、問題は自然に topology と protocol の問題へ変わる。誰が誰へ message を送れるか。どの agent が durable state を共有するか。どの Supervision Tree が workflow 全体を所有するか。`delegate_task` に flag を継ぎ足し続ける話ではなくなる。

**Cron と定時スケジューリングは普通の scheduler process である。** Hermes は「background thread + file lock + inline task execution」という組み合わせで cron tick を実装している。この構造では、一つの stuck task が scheduler loop 全体を人質に取れてしまう。OTP では scheduler は、何が期限到来したかを判断し、Supervisor 管理下の Job Worker を起動するだけの GenServer でよい。ある job が stuck しても crash しても、それは特定の Supervision domain の中で起きた普通の子 process failure にすぎない。scheduler 自体は無傷でいられる。OpenClaw 側でも同様で、定時起動が必要な background task のために、`globalThis` に醜い scheduling state をぶら下げ続ける必要はなくなる。

**本当に注目すべきなのは、何が消えるかである。** OpenClaw の process-global queue state、再起動後に stale completion callback を無視するための generation counter、詰まった scheduling state を救うための `resetAllLanes()` のような escape hatch は、その存在理由を大きく失う。Hermes の「thread ごとに新しい `AIAgent` を作れ、共有するな」という警告も自然に消える。state isolation は process isolation から来るのであって、開発者の discipline に依存しないからだ。Gateway 側で手作業で維持していた `_running_agents` map、cron の相互排他のための file lock、SQLite WAL による session persistence の補償設計も、その必要性はかなり下がる。複雑さそのものは消えないが、それは Supervisor 配下の process と明示的な message protocol へ下がっていく。そしてそれこそが、本来あるべき場所だ。

まともな supervision tree は、おおむね次のような形に近づくだろう。

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

## この判断の境界

OTP がすべてを解決する銀の弾丸でないのは明らかだ。durable な session storage、外部 delivery logic、model/provider 固有の policy は依然として必要である。Provider Stream は相変わらず癖を持ちうるし、永続化された transcript は process memory の外に置かなければならないし、user-facing な message delivery には明示的な routing と retry logic が必要だ。OTP が変えるのは、最も難しい orchestration code をどこへ置くべきかという一点である。state ownership、local concurrency、failure isolation、message routing、recovery logic がランタイムモデルへ沈み、ネイティブな一部になる。そうすることで、アプリケーション層で終わりなく手作業の継ぎはぎを続ける必要がなくなる。

## 結び

マルチエージェント・オーケストレーションは、本質的には Actor Model の問題である。対話的であり、中断可能であり、長時間動き、局所的に失敗しやすく、message-driven である。これらは AI 特有の奇妙な要求ではない。むしろ Erlang が 1986 年に作られたときに正面から向き合っていた要求そのものだ。OTP の Process、Mailbox、Supervision Tree は、この問題領域に対するネイティブな抽象であって、何かの代用品ではない。

OpenClaw と Hermes の codebase は、そのことをすでに十分に証明している。彼らは単に model API を一枚包んでいるのではない。process ownership、Mailbox、Supervision、restart behavior をコードの中で作り直しているのだ。言い換えれば、彼らはすでに actor model と OTP を模倣している。ただしネイティブサポートを持たない言語のアプリケーション層で、不格好に車輪を再発明しているだけなのである。
