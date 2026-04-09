---
title: 'Modern Productivity Tools and Brickdoc'
description: 'Using Zapier, Airtable, and Coda as representative cases, this essay examines the boundaries and weaknesses of modern productivity tools, and where Brickdoc fits.'
pubDate: '2021-04-09'
tags:
  - Product Strategy
original: false
heroImage: "cover.png"
---

## What Are Modern Productivity Tools

SaaS products represented by [Airtable](https://airtable.com/) and [Coda](https://coda.io/) are, in essence, solutions that help citizen developers[^1], that is, end users without technical backgrounds, create small CRUD applications, automation scripts, and interactive documents.

In practice, these solutions cut across at least three traditional software categories: low-code development platforms, including RPA, BI systems, and office software. Their focus is to systematically build a digital work experience better suited to current needs, rather than to remain bound to any one implementation path. As long as a feature helps solve the job to be done, they can embed capabilities that used to belong to entirely different categories of vertical software. For that reason, it is more appropriate to refer to them collectively as "modern productivity tools" than to force them into a single legacy software category.[^2]

## Representative Product Analysis: Zapier

### Prehistory: IFTTT

[IFTTT](https://ifttt.com/) is a SaaS service for automating third-party API calls based on rules. It launched in 2011, when the idea of Web 2.0 was still at its peak. That moment also happened to be a milestone year in which many classic Web 2.0 products were opening up third-party APIs and launching platform strategies.[^3] To a large extent, IFTTT was a product of that open-platform wave.

In practice, IFTTT could integrate not only more consumer-facing APIs such as Facebook and Twitter, but also industry APIs such as GitHub, Salesforce, and Square.

### Zapier's Product Logic

[Zapier](https://zapier.com/), released in late 2012[^4], was clearly inspired by IFTTT, but it differed from IFTTT in several important ways.[^5]

Unlike IFTTT's simple `if...then...` logic, Zapier supports logic such as `if...else...`, `filter` conditions, and `for each` loops[^6], and it allows users to connect multiple apps and steps within a single workflow, either in sequence or in parallel. That is indispensable if you want to automate real business scenarios rather than toy examples.

In addition, Zapier's strategy of using long-tail keywords such as "Send Gmail email alerts for new Salesforce leads" as a primary organic acquisition channel played a decisive role in its early scalable growth.[^7]

In terms of use cases, "marketing automation" has long been Zapier's core customer base. In other words, beyond integrating third-party APIs, Zapier also built a series of lightweight APIs of its own around mainstream use cases such as marketing automation.[^8]

### Why IFTTT Could Not Become Zapier

Under today's definition of low-code, both IFTTT and Zapier are standard low-code platforms. At a fundamental level, the value a low-code platform provides is not that different from the value a traditional programming language provides. For mature programming languages, one of the hardest problems is how to balance "changing the syntax to add new capabilities" against "remaining compatible with old code and preserving the portability of users' accumulated experience." The split between Python 2 and Python 3 had a profound impact on that ecosystem.

The same problem exists in low-code platforms. Their UI and interaction model function, in effect, like the syntax and reserved words of a programming language. If IFTTT had tried to graft on the kinds of filtering and branching features that Zapier supports, that interaction change could easily have caused heavy churn among its existing users.

Unlike conventional SaaS products, low-code platforms are in fact closer to foundational software such as operating systems, databases, and compilers. Changes to existing capabilities or interactions can create fatal problems for the ecosystem built on top of them. Windows 11, for example, still has to preserve some inherited quirks because parts of its APIs remain compatible with data structures dating back to Windows 3.2 in the early 1990s.[^9] That is why low-code products are poorly suited to the traditional internet-product playbook of moving fast and patching later. Their API design and core data structures need to be thought through from the beginning.

### Zapier's Weaknesses

As noted above, scenarios such as marketing automation still account for the bulk of Zapier's user base. But the other side of that fact is that Zapier has never really found a second must-have use case outside marketing automation.

The underlying reason is that, although Zapier supports logic such as loops, its interaction model still cannot fully satisfy the more complex and non-standard workflow automation needs that exist outside marketing automation. At its core, Zapier is a service that helps users write scripts in a visual way: users fetch data, process it, and output it as if they were composing a script. In the real world, however, users often prefer more intuitive and visual ways of manipulating data, closer to Excel. Even in data science, a field made up of professional data scientists and data engineers, people still rely on visual tools such as Jupyter Notebook to process data rather than depending purely on writing and debugging scripts.

## Representative Product Analysis: Airtable

[Airtable](https://airtable.com/) was founded in 2012, but did not ship its first product until 2014.[^10] The earliest version of Airtable drew not only from Excel, but also heavily from [FileMaker](https://www.claris.com/filemaker/) and [Firebase](https://firebase.google.com/?hl=zh-cn). Early Airtable entered through the web-form use case, similar to Typeform or Chinese products such as Jinshuju, and then gradually expanded toward classic FileMaker-like scenarios such as internal workflows and office administration. Unlike FileMaker, Airtable deliberately limited the flexibility of forms and table layouts. Much like Notion's constraints compared with MS Word, those limits materially lowered the barrier to entry.

When Airtable officially launched its API in mid-2015[^11], it marked its transition from a web-form tool into a Firebase-like, user-friendly cloud database.[^12] That transition had an enormous impact on Airtable's path to a valuation of $5.77 billion. In traditional enterprise software development, a large portion of custom software outsourcing demand could in principle have been handled by Excel alone, but the need to exchange data with upstream and downstream enterprise applications forced companies into custom development.

Among Airtable's paying users, startups make up a meaningful share. They often use Airtable directly as a Firebase-like cloud database in their MVPs in order to avoid the cost of operating databases and building admin backends for their apps.[^13] So much so that startups such as [Flairtable](https://flairtable.com/) even emerged to provide developers with complete technical solutions for using Airtable as a cloud database.

### Airtable's Weaknesses

As noted above, many startups use the paid version of Airtable inside their MVPs. That creates a strange paradox in Airtable's retention profile: users adopt it as a low-cost way to start experimenting, while planning to replace it with an in-house backend once the product begins to scale.

In addition, not all data is well suited to structured presentation in tables. A table is, in fact, only one subset of the broader rich-text document.

## Representative Product Analysis: Coda

[Coda](https://coda.io/) was founded in 2014.[^14] Although it is less widely known than [Notion](https://notion.com/), its original MVP actually shipped earlier than Notion's. By combining collaborative online documents, spreadsheets, and integrations with third-party APIs, Coda enabled end users to create documents that functioned like applications.

In Coda 2.0, released in late 2019, Coda introduced a Notion-inspired Block concept that gave it the ability to share data across documents. Coda called this "[Packs](https://blog.coda.io/a-building-block-that-keeps-up-with-your-data-e6291ec0784a?gi=2914d145fdb3)."

### Coda's Weaknesses

- The Block concept did not exist in Coda's earliest versions and was only introduced in 2.0, which means that many of Coda's underlying structural decisions sit uneasily with Blocks.
- Coda's interoperability with third-party services relies mainly on Zapier support rather than direct third-party API integrations. But integrations between other services and Zapier were clearly not optimized for a Coda-like use case, which creates a number of UX problems in practice.
- Coda's user education system and UX are extremely unintuitive, making its onboarding cost arguably the highest among comparable tools. More specifically, its interaction patterns for automation are not intuitive enough, the learning cost of specifying automation rules is relatively high, and although different templates present themselves in different ways, the later-stage presentation feels redundant and overall not flexible enough.

---

## What Brickdoc Is

- It helps public-cloud and API capability providers reach end users directly.
- It enables users to complete tasks efficiently that would traditionally require writing code.
- It is a collaborative work product that supports both human-to-human collaboration and human-to-machine collaboration.
- It is an open-source project in the spirit of WordPress or Odoo.

## What Brickdoc Is Not

- It is not Google Docs or Word. Brickdoc does not support complex print-oriented layout features such as headers, margins, and similar page-formatting controls.
- It is not Evernote, Flomo, or OneNote. Although Brickdoc can be used as a personal note-taking tool, it will not spend much of its energy optimizing that use case.
- It is not a Notion-style all-in-one product. Rather than replacing products such as Jira, Trello, or Dropbox, Brickdoc is better understood as a hub that helps users connect data across them. Concretely, if Brickdoc one day supports a Kanban Block, the expectation is that the data inside that Kanban can sync bidirectionally with Trello, GitHub, and Jira.
- The "doc" in Brickdoc refers to a broad HTML-document-like notion of a document, not a paper document in the literal sense.

## References

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
