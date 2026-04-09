---
title: '次世代生産性ツールと Brickdoc'
description: 'Zapier、Airtable、Coda を代表例として、「次世代生産性ツール」の輪郭と弱点、そして Brickdoc の立ち位置を考える。'
pubDate: '2021-04-09'
tags:
  - プロダクト戦略
original: false
heroImage: "cover.png"
---

## 次世代生産性ツールとは何か

[Airtable](https://airtable.com/)、[Coda](https://coda.io/) に代表される SaaS プロダクトは、本質的にはシチズンデベロッパー（Citizen developers）[^1]、つまり技術的な背景を持たないエンドユーザーが、小規模な CRUD アプリケーション、業務自動化スクリプト、インタラクティブなドキュメントを作るためのソリューションである。

こうしたソリューションは、実質的には少なくとも三つの伝統的なソフトウェアカテゴリを横断している。すなわち、RPA を含むローコード開発プラットフォーム、BI システム、そしてオフィスソフトである。彼らが重視しているのは、現代の要請により適合したデジタル業務体験を体系的に構築することであり、実装上の形式に縛られることではない。課題解決に役立つのであれば、どのような垂直ソフトウェア特有の機能でもプロダクトの中に取り込むことができる。そうである以上、これらを無理に既存の単一カテゴリへ押し込むよりも、「次世代生産性ツール」と呼ぶ方が実態に近い。[^2]

## 代表的プロダクト分析: Zapier

### 先史時代: IFTTT

[IFTTT](https://ifttt.com/) は、ルールに従ってサードパーティ API を自動実行するための SaaS サービスであり、Web 2.0 という概念がなお熱を帯びていた 2011 年に登場した。この時期は、典型的な Web 2.0 プロダクト群が外部 API を公開し、オープンプラットフォームの潮流が本格化した節目の年でもあった。[^3] その意味で IFTTT は、当時の「オープンプラットフォーム・ブーム」の産物だったと言える。

実際、IFTTT が統合できたのは Facebook や Twitter のような消費者向け API だけではなく、GitHub、Salesforce、Square といった業界向け API も含まれていた。

### Zapier のプロダクト観

2012 年後半に公開された [Zapier](https://zapier.com/) [^4] は、確かに IFTTT から大きな示唆を受けていたが、いくつかの重要な点で IFTTT とは大きく異なっていた。[^5]

IFTTT の単純な `if...then...` ロジックとは異なり、Zapier は `if...else...`、`filter` 条件、`for each` ループ[^6] といったロジックをワークフロー内で扱うことができる。また、一つのワークフローの中で複数のアプリやステップを直列にも並列にも組み合わせられる。これは、実世界のビジネスシナリオを自動化するうえで不可欠である。

さらに、「Send Gmail email alerts for new Salesforce leads」のようなロングテールキーワードを主要な自然流入チャネルとして使う戦略も、Zapier の初期のスケール成長に決定的な役割を果たした。[^7]

ユースケースの面では、「マーケティングオートメーション」が長らく Zapier の主要顧客層を占めてきた。つまり Zapier は、サードパーティ API の統合を提供するだけでなく、マーケティングオートメーションのような主要シナリオに向けた軽量な API 群を自ら開発してきたのである。[^8]

### なぜ IFTTT は Zapier になれなかったのか

今日の定義に照らせば、IFTTT も Zapier も標準的なローコードプラットフォームである。ローコードプラットフォームが提供している価値は、本質的には従来のプログラミング言語が提供する価値と大きく変わらない。成熟したプログラミング言語にとって難題なのは、「新機能を追加するために文法を変えること」と、「既存コードとの互換性を維持し、ユーザーが積み上げた経験の移植可能性を守ること」のバランスをどう取るかである。Python 2 と Python 3 の分断は、その典型例だった。

同じ問題はローコードプラットフォームにも存在する。ローコードプラットフォームにおける UI や操作ロジックは、実質的にはプログラミング言語における文法や予約語に相当する。したがって、IFTTT が Zapier のような分岐やフィルタ機能を後付けで導入しようとすれば、そのインタラクション変更によって既存ユーザーの大規模な離脱を招く可能性が高い。

また、ローコードプラットフォームは従来の SaaS プロダクトというより、OS、データベース、コンパイラといった基盤ソフトウェアに近い性質を持つ。既存機能や既存インタラクションへの変更は、その上に成り立つエコシステムに致命的な問題を生みうる。実際、Windows 11 でさえ、1990 年代初頭の Windows 3.2 に由来するデータ構造との互換性を維持するため、一部の「先祖伝来のバグ」を抱え続けている。[^9] だからこそ、ローコード系プロダクトは「速く、粗く、強く進めて後で直す」という従来のインターネット的手法には向かない。API 設計とコアデータ構造は最初から慎重に設計される必要がある。

### Zapier の弱点

前述の通り、現時点でも「マーケティングオートメーション」は Zapier のユーザーベースの大半を占めている。しかし裏を返せば、Zapier はこれまで、マーケティングオートメーション以外で第二の大きな成長シナリオとなる強い需要を見つけられていないということでもある。

その本質的な理由は、Zapier がループのようなロジックをサポートしていても、そのインタラクションモデル自体は、マーケティングオートメーション以外に存在するより複雑で非定型な業務自動化ニーズを完全には満たせない点にある。Zapier は本質的に、ユーザーがスクリプトを書くことを視覚的に補助するサービスであり、データの取得、処理、出力をスクリプトの形で組み立てていく。しかし現実のユーザーは、データ処理や加工を Excel のような、より直感的で視覚的な方法で行いたいことが多い。専門のデータサイエンティストやデータエンジニアで構成されるデータサイエンスの分野ですら、人々は純粋なスクリプト記述とデバッグだけに頼るのではなく、Jupyter Notebook のような可視的な方法でデータを扱っている。

## 代表的プロダクト分析: Airtable

[Airtable](https://airtable.com/) は 2012 年に設立されたが、最初のプロダクトを出したのは実際には 2014 年だった。[^10] 初期の Airtable は Excel だけでなく、[FileMaker](https://www.claris.com/filemaker/) と [Firebase](https://firebase.google.com/?hl=zh-cn) からも強い影響を受けていた。初期の Airtable は実質的に Web フォームを入口とし、Typeform や中国の Jinshuju のようなユースケースから出発して、その後、社内ワークフローや OA といった従来の FileMaker 的シナリオへと徐々に進んでいった。FileMaker と異なるのは、Airtable がフォームや表レイアウトの自由度を意図的にある程度制限していた点である。Notion が MS Word に比べてレイアウトの自由度を制限したのと同様に、この制約はユーザーの学習コストを下げる効果を持っていた。

2015 年半ばに Airtable が正式に API を公開したこと[^11] は、Web フォームツールから Firebase 的なユーザーフレンドリーなクラウドデータベースへ移行したことを意味していた。[^12] この転換は、Airtable が今日 57.7 億ドル規模の評価額に到達するうえで極めて大きな意味を持った。従来の企業向けソフトウェア開発の世界では、本来 Excel だけで満たせたはずのニーズが数多くあったが、他の業務アプリケーションとデータ連携する必要があるために、カスタム開発へ進まざるを得なかったからである。

現在の Airtable の有料ユーザーの中では、スタートアップがかなり大きな割合を占めている。彼らは MVP の段階で Airtable を Firebase 的なクラウドデータベースとして直接利用し、データベース運用やアプリ管理画面の開発コストを節約しようとする。[^13] その結果、[Flairtable](https://flairtable.com/) のように、Airtable をクラウドデータベースとして使うための包括的な技術ソリューションを開発者向けに提供するスタートアップまで現れた。

### Airtable の弱点

前述の通り、多くのスタートアップは Airtable の有料版を自分たちの MVP に組み込んでいる。これは Airtable の継続利用において奇妙な逆説を生む。ユーザーは、低コストで試行錯誤を始めるための手段として Airtable を採用する一方で、プロダクトが本格的に成長した段階では、自前のバックエンドに置き換えることを前提としているからである。

また、すべてのデータが表形式での構造化表示に向いているわけではない。実際、表というものはリッチテキスト文書全体の部分集合にすぎない。

## 代表的プロダクト分析: Coda

[Coda](https://coda.io/) は 2014 年に創業した。[^14] 知名度では [Notion](https://notion.com/) にやや劣るものの、最初の MVP が公開されたのはむしろ Notion より早かった。オンライン共同編集ドキュメント、表計算、各種サードパーティ API 統合を組み合わせることで、Coda はエンドユーザーがアプリと同等の機能を持つドキュメントを作れるようにした。

2019 年後半に公開された Coda 2.0 では、Notion に着想を得た Block の概念が導入され、ドキュメントをまたいだデータ共有が可能になった。Coda はこれを「[Packs](https://blog.coda.io/a-building-block-that-keeps-up-with-your-data-e6291ec0784a?gi=2914d145fdb3)」と呼んでいる。

### Coda の弱点

- Block という概念は初期の Coda には存在せず、2.0 で初めて導入された。そのため、Coda の基盤構造の多くは Block との緊張関係を抱えている。
- Coda とサードパーティサービスの相互運用性は、直接 API を統合するのではなく、主として Zapier 連携に依存している。しかし、他サービスと Zapier の統合は Coda のような文脈のために最適化されたものではないため、実運用では UX 面の問題が多い。
- Coda のユーザー教育システムと UX はきわめて直感的ではなく、結果として導入コストは同種のツールの中でも最も高い部類に入る。特に、自動化機能の見せ方が分かりにくく、オートメーションルールを指定するための学習コストが高い。テンプレートごとに見え方は異なるものの、後半になると表現が冗長になり、全体として柔軟さにも欠ける。

---

## Brickdoc とは何か

- パブリッククラウドや API 提供事業者が、エンドユーザーへ直接リーチすることを助ける。
- 従来であればコードを書かなければ達成できなかった作業を、ユーザーが効率よく完了できるようにする。
- 人と人の協働だけでなく、人と機械の協働も支えるコラボレーティブな業務プロダクトである。
- WordPress や Odoo のようなオープンソースプロジェクトである。

## Brickdoc ではないもの

- Google Docs や Word ではない。Brickdoc は、ヘッダーや余白といった印刷前提の複雑なレイアウト機能をサポートしない。
- Evernote、Flomo、OneNote ではない。個人向けノートとして使うことはできても、その体験を最適化することに大きな労力を割くつもりはない。
- Notion 風の All-in-One プロダクトではない。Jira、Trello、Dropbox などを置き換えるのではなく、それらの間のデータをつなぐ Hub になることを目指している。具体的には、将来 Brickdoc が Kanban Block をサポートするとしても、そのデータは Trello、GitHub、Jira と双方向同期できるべきだと考えている。
- Brickdoc における doc とは、紙の文書ではなく、広義の HTML Document 的な doc を指す。

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
