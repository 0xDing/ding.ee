---
title: '新一代生产力工具与 Brickdoc'
description: '从 Zapier、Airtable、Coda 三类典型产品切入，讨论“新一代生产力工具”的边界、短板，以及 Brickdoc 的定位。'
pubDate: '2021-04-09'
tags:
  - 产品策略
original: true
heroImage: "cover.png"
---

## 什么是新一代生产力工具

以 [Airtable](https://airtable.com/)、[Coda](https://coda.io/) 为代表的 SaaS 产品，本质上均为一种帮助公民开发者（Citizen developers）[^1]，也就是不具有技术背景的终端用户，去创造小型 CRUD（数据增删改查）类应用程序、自动化脚本和可交互式文档的解决方案。

这类解决方案实质上跨越了至少三种传统的软件产品类目，包括低代码开发平台（含 RPA）、BI 系统和办公软件。它们聚焦于系统化地构建更符合当下时代需求的数字化办公体验，而并不拘泥于实现方式。只要有助于满足场景需求，它们可以在产品中嵌入任何垂直软件所特有的功能。因此，相较于生硬地将这类产品归类于某一传统软件产品类目，采用「新一代生产力工具」作为这类产品的通用叫法会显得更为合适。[^2]

## 典型产品分析：Zapier

### 史前时代：IFTTT

[IFTTT](https://ifttt.com/) 是一个用于根据规则自动化调用第三方 API 接口的 SaaS 服务，推出于 Web 2.0 概念正当红的 2011 年。这一时间点也恰逢其会地正是各类典型 Web 2.0 产品开始提供第三方 API 接口、开放平台浪潮兴起的里程碑式年份[^3]。因此，很大程度上，IFTTT 是受到当年的「开放平台潮」影响而出现的产物。

实际上，除了集成诸如 Facebook、Twitter 之类更偏向 C 端用户的 API 接口，诸如 GitHub、Salesforce、Square 之类的行业 API 同样也是 IFTTT 所能够集成的。

### Zapier 的产品观

于 2012 年下旬发布的 [Zapier](https://zapier.com/) [^4]，尽管在不小程度上受到了 IFTTT 的启发，但其在下述领域与 IFTTT 存在着巨大区别[^5]。

不同于 IFTTT 简单的 `if...then...` 逻辑，Zapier 支持在创建的工作流中使用诸如 `if...else...`、`filter` 筛选条件、`for each` 循环[^6]之类的逻辑规则，并且允许用户以并行或串行的方式在一个工作流中调用多个应用和步骤，而这对于实现真实世界中的商业场景自动化而言是必不可少的。

此外，Zapier 使用诸如「Send Gmail email alerts for new Salesforce leads」之类的长尾关键词作为主要自然流量获取渠道的策略，也对其早期的规模化增长产生了决定性作用[^7]。

在用户场景覆盖上，「营销自动化」一直是 Zapier 的主要客群来源。因此，事实上 Zapier 在提供第三方 API 整合之外，还就诸如「营销自动化」之类的主流场景自行开发了一系列与此类场景相关的轻量级 API[^8]。

### 为什么 IFTTT 成不了 Zapier

以时下对于低代码的定义而言，IFTTT 和 Zapier 都是标准的低代码平台。低代码平台本质上所提供的价值和传统的编程语言并无二致。对于使用时间较为久远的编程语言而言，如何在「修改语法增加新特性」和「兼容历史代码、确保用户既有开发经验的可迁移性」之间取得平衡，是一大难题。如 Python 3 与 Python 2 之前版本之间的大撕裂问题，就对于其开发者社区造成了深远影响。

这一问题也同样存在于低代码平台之中。低代码平台的 UI 界面、交互逻辑，实质上相当于传统编程语言中的语法和保留字。因此，如果 IFTTT 参照 Zapier 增加筛选、过滤等逻辑特性，那么这一交互上的变更可能会造成其既有用户的大量流失。

不同于传统 SaaS 产品，低代码平台事实上高度类似于操作系统、数据库、编译器等传统基础软件。针对已有功能或交互的改动，将导致其现有生态出现极为致命的问题。正如 Windows 11 发布的当下，依然因为需要在部分 API 中兼容 90 年代早期 Windows 3.2 的数据结构，而不得不保留一部分「祖传 Bug」[^9]。因此，低代码平台类产品并不适用于传统互联网产品「快、糙、猛」的方法论，而需要一开始就对 API 设计和核心数据结构设计深思熟虑。

### Zapier 的短板

如前所述，现阶段「营销自动化」一类的场景占据了 Zapier 用户群的大头。但反过来说，这也意味着 Zapier 一直以来没有找到「营销自动化」之外的刚需场景作为第二增长点。

其实质上是因为，尽管 Zapier 支持了诸如循环之类的逻辑规则，但就用户交互的逻辑而言，依然无法完全满足「营销自动化」之外那些更复杂、非标的工作自动化场景需求。其原因在于，Zapier 本质上是一个以可视化的方式帮助用户编写脚本的服务，用户以编写脚本的形式完成数据的获取、处理和输出。而在真实世界中，用户往往更期望以类似 Excel 之类更为直观、可视化的方法来完成数据的处理与加工。即便是在由专业数据科学家和数据工程师所构成的数据科学领域中，大家依然会使用 Jupyter Notebook 之类的可视化方法来进行数据加工，而非纯粹依靠脚本的编写和调试。

## 典型产品分析：Airtable

[Airtable](https://airtable.com/) 成立于 2012 年，但实际上直到 2014 年才发布第一版产品[^10]。最初版本的 Airtable，除了 Excel 之外，还在很大程度上受到了 [FileMaker](https://www.claris.com/filemaker/) 和 [Firebase](https://firebase.google.com/?hl=zh-cn) 的启发。早期版本的 Airtable 实际上主要以 Web 表单作为业务场景的切入点，例如 Typeform 或国内的金数据，随后逐步开始向内部工作流、OA 等传统的 FileMaker 场景推进。不同于 FileMaker 的是，Airtable 有意而为之地对表单和表格布局的灵活度进行了一定限制。正如 Notion 相较于 MS Word 在排版布局方面所做的限制一样，这种限制实质上起到了很大程度上降低用户上手门槛的作用。

在 2015 年中旬 Airtable 正式发布 API[^11] 之后，则预示着其完成了从 Web 表单工具到 Firebase 式用户友好型云端数据库的转型[^12]。这一转型对于 Airtable 成就今日 57.7 亿美元的市值有着极其深远的影响。事实上，在传统企业软件开发领域，绝大部分软件外包需求原本都是 Excel 所能够满足的，但由于需要和其他上下游企业应用进行数据交互，才不得不以定制化外包的方式来进行需求交付。

在当下的 Airtable 付费用户中，初创公司占据了不小的比例。它们往往在 MVP 中直接将 Airtable 作为 Firebase 式的云数据库服务使用，以期从而节省运维数据库和开发 App 管理后台的成本[^13]。以至于甚至出现了诸如 [Flairtable](https://flairtable.com/) 之类的创业公司，面向开发者提供将 Airtable 作为云端数据库的全套技术解决方案。

### Airtable 的短板

如前文所述，大多数初创公司将 Airtable 的付费版应用于它们的 MVP 产品中，这实际上造成了 Airtable 在复购率上的一种奇异悖论: 用户将 Airtable 作为低成本的试错起点，并计划在产品高速发展之后，再自行开发用于替代 Airtable 的后端服务。

此外，并不是所有数据都适合以表格形式进行结构化呈现。事实上，表格仅仅只是富文本文档的一个子集。

## 典型产品分析：Coda

[Coda](https://coda.io/) 创建于 2014 年[^14]。尽管其知名度稍逊于 [Notion](https://notion.com/)，但实际上其最初的 MVP 发布时间要早于 Notion。通过将在线协同文档、表格和各种第三方 API 集成在一起，Coda 使得终端用户得以创建一个功能等同于 App 的文档。

在 2019 年下旬发布的 Coda 2.0 中，Coda 引入了受 Notion 启发的 Block 概念，使得其具有了跨文档进行数据共享的能力，Coda 将之称为「[Packs](https://blog.coda.io/a-building-block-that-keeps-up-with-your-data-e6291ec0784a?gi=2914d145fdb3)」。

### Coda 的短板

- Coda 的 Block 概念并不存在于其最初的版本中，直到 2.0 版本方才引入，使得实际上 Coda 的很多底层结构设计存在与 Block 冲突之处。
- Coda 和第三方服务的互操作性，主要通过对 Zapier 的支持而非直接集成第三方 API 来实现。而第三方服务与 Zapier 之间的集成，显然并不是为类似 Coda 这样的场景而优化的，因此在实际使用中存在较多用户体验层面的问题。
- Coda 的用户教育体系和 UX 极不直观，使得其上手成本事实上是同类工具中最为高昂的。具体而言，Coda 在智能自动化的探索上采用的展示交互形式不够直观，指定自动化模式的学习成本也比较高。虽然不同模板拥有不同的展现形式，但后期展示上样式冗余，整体也不够灵活。

---

## Brickdoc 是什么

- 帮助公有云和 API 能力厂商直接触达终端用户。
- 帮助用户有能力高效地完成传统意义上必须写代码才能完成的事务。
- 同时支持人与人协同以及人与机器协同的协同办公产品。
- 类似 WordPress、Odoo 的开源项目。

## Brickdoc 不是什么

- 不是 Google Docs、Word。Brickdoc 不支持页眉、页边距等面向印刷场景的复杂排版功能。
- 不是 Evernote、Flomo、OneNote。尽管 Brickdoc 可以被用来作为个人笔记软件，但 Brickdoc 不会花太多精力在优化这类场景的体验之上。
- 不是 Notion 风格的 All-in-One 产品。相较于让用户使用 Brickdoc 来取代诸如 Jira、Trello、Dropbox 之类的现有产品，我们更乐意让 Brickdoc 成为帮助用户打通这些产品彼此数据的 Hub。具体而言，如果有一天 Brickdoc 需要支持 Kanban Block，我们期望 Kanban 中的数据是可以和 Trello、GitHub、Jira 双向同步的。
- Brickdoc 的 doc 指的是广义的、HTML Document 式的 doc，而不是字面意义上的纸质文档。

## 参考文献

[^1]: [Definition of Citizen Developer - IT Glossary | Gartner](https://www.gartner.com/en/information-technology/glossary/citizen-developer)
[^2]: [The Case for Modern Productivity Tools - GRID Blog](https://medium.com/grid-spreadsheets-run-the-world/the-case-for-modern-productivity-tools-681cef71c9c)
[^3]: [2012国内互联网开放平台分析](https://www.huxiu.com/article/6734.html)
[^4]: [How Zapier Went From Zero to 600,000+ Users in Just Three Years](https://www.groovehq.com/blog/zapier-interview-with-wade-foster)
[^5]: [5 Entrepreneurs Who Inspire Strategy at Zapier](https://zapier.com/blog/5-entrepreneurs-who-inspire-strategy-zapier/)
[^6]: [How to repeat action(s) in your Zap for a variable number of values](https://community.zapier.com/featured-articles-65/how-to-repeat-action-s-in-your-zap-for-a-variable-number-of-values-3037)
[^7]: [Finding Early Customers When You Aren't Internet Famous](https://zapier.com/blog/finding-early-customers-when-you-arent-internet-famous/)
[^8]: [Grow your business with marketing automation](https://zapier.com/blog/marketing-automation-use-cases/)
[^9]: [Why can't I name a folder or file 'CON' in Windows?](https://superuser.com/questions/86999/why-cant-i-name-a-folder-or-file-con-in-windows)
[^10]: [Show HN: Airtable, a real-time spreadsheet-database hybrid](https://news.ycombinator.com/item?id=8373914)
[^11]: [Your API is ready](https://blog.airtable.com/your-api-is-ready/)
[^12]: [3 workflows to help you be an Airtable expert](https://zapier.com/blog/airtable-automations/)
[^13]: [Using Airtable as backend service](https://dev.to/hawaii/using-airtable-as-backend-service-2ad7)
[^14]: [Coda - Crunchbase](https://www.crunchbase.com/organization/coda-add7)
