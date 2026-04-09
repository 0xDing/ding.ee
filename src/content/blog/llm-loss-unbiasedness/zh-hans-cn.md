---
title: 'LLM Loss 的无偏性：NTP、MTP 与 STP'
description: 'NTP、MTP、STP 三种训练目标，经常被放在一起比较"谁更好"。但"好"相对于什么？三者各自回答的问题并不相同——NTP 试图严格学到训练语料的联合分布，MTP 试图更快逼出"后面大概往哪走"的高层表征，STP 试图让 hidden state 的演化轨迹更平滑、更少横向漂移。这三件事不是一回事。而"无偏性"——即 loss 的最优解是否恰好等于语料的真实分布——恰恰是区分它们的最干净的判据。本文从这个判据出发，逐一考察三者。'
pubDate: '2026-04-01'
tags:
  - LLM
heroImage: "cover.jpg"
original: true
---


## 1. NTP、MTP、STP 分别是什么

### 1.1 NTP：Next-Token Prediction

标准的自回归语言模型训练目标：给定前缀 $x_{<t}$，预测下一个 token $x_t$。

$$
\mathcal L_{\text{NTP}} = -\sum_t \log q_\theta(x_t \mid x_{<t})
$$

今天几乎所有 decoder-only LLM 的基本训练方式。非常朴素，但有一个别的目标很难替代的性质——它正好对应语料联合分布的链式分解。


### 1.2 MTP：Multi-Token Prediction

从当前 prefix 一次看更远几步。最 naive 的形式：

$$
\mathcal L_{\text{MTP}} = -\log r_{1,\theta}(x_{t+1}\mid x_{\le t}) - \beta_2 \log r_{2,\theta}(x_{t+2}\mid x_{\le t}) - \cdots
$$

直觉动机不难理解：强迫模型更早抓住主题，更早形成高层结构感，提升 data efficiency 或 representation quality，减少只会局部接龙的倾向。

但问题也恰恰出在这里——它让模型过早地去概括未来。


### 1.3 STP：Semantic Tube Prediction

STP 来自 2026 年 2 月的一篇 arXiv 论文 *Semantic Tube Prediction: Beating LLM Data Efficiency with JEPA*（Hai Huang、Yann LeCun、Randall Balestriero）。它提出的不是 token-space 的多步预测，而是一个 JEPA-style 的 hidden-state regularizer：假设语言的 hidden trajectory 在语义流形上应当局部接近 geodesic，于是通过一个"语义管"约束，把 hidden state 的演化限制在 geodesic 附近。训练目标是标准 NTP cross-entropy 加上 STP regularizer。论文报告，在其实验设置里，STP 能以更少训练数据达到接近基线的效果。

关键区分：**STP 不直接改 token 监督；它改的是 hidden 表征空间的几何偏好。** 这和 MTP 是本质不同的。


## 2. 什么是"无偏性"

"无偏"在不同语境里含义不同。本文的定义如下。

### 2.1 数学定义

设训练语料来自真实分布 $p^*(x_{1:T})$。模型为

$$
q_\theta(x_{1:T})=\prod_t q_\theta(x_t\mid x_{<t})
$$

对一个训练目标 $\ell(x;\theta)$，其总体风险为

$$
\mathcal R(\theta)=\mathbb E_{x\sim p^*}[\ell(x;\theta)]
$$

如果最小化总体风险的最优解恰好满足

$$
q_\theta(x_t\mid x_{<t}) = p^*(x_t\mid x_{<t}) \quad \forall t
$$

亦即 $q_\theta(x_{1:T}) = p^*(x_{1:T})$，

则称该 loss 对"学习训练语料分布"这个目标**无偏**。

换言之：优化的目标，和"把语料分布学对"，是否是同一个目标。

### 2.2 直观理解

无偏 = 训练时问的问题，和推理时真正要解决的问题，是同一个问题。

对标准 AR-LM，推理时做的事是：看到真实历史前缀 → 预测下一个 token → 纳入上下文 → 继续预测。训练如果也在做"给定真实前缀，预测真实下一个 token"，则训练目标与生成机制对齐。

但如果训练时做的是"给定当前前缀，提前概括下两步下三步"，或者"即便 token 预测没错，也强行要求 hidden trajectory 更直、更平滑"——就在训练里加入了额外偏好。这类偏好可以有用，但不再是严格的"无偏"。


## 3. NTP 为什么无偏

三者里最干净的部分。

NTP 的 loss 是

$$
\mathcal L_{\text{NTP}} = -\sum_t \log q_\theta(x_t\mid x_{<t})
$$

由链式法则，$q_\theta(x_{1:T})=\prod_t q_\theta(x_t\mid x_{<t})$，所以

$$
-\sum_t \log q_\theta(x_t\mid x_{<t}) = -\log q_\theta(x_{1:T})
$$

对真实数据分布取期望：

$$
\mathcal R_{\text{NTP}} = \mathbb E_{p^*}[-\log q_\theta(x_{1:T})] = H(p^*) + \mathrm{KL}(p^* \| q_\theta)
$$

$H(p^*)$ 是常数，真正被优化的是 $\mathrm{KL}(p^* \| q_\theta)$。总体风险在且仅在 $q_\theta = p^*$ 时达到最小。

**NTP 不是"差不多合理"的训练目标。它就是语料联合分布最大似然的链式展开。**

这也是它具有一种非常特殊地位的原因。别的 loss 可以 useful，但很难在目标层面如此干净。

一个更直观的说法——NTP 学的是"剧情"：先看到 A，再决定 B，在 AB 的条件下再决定 C。不试图跳步骤，也不试图提前把未来压成摘要。它严格尊重了语言生成的路径依赖。


## 4. MTP 为什么有偏

如果单独训练一个"二步预测头"去拟合 $p^*(x_{t+2}\mid x_{\le t})$，那这个头对它自己的 forecasting 目标并不一定有偏——cross-entropy 对这个条件分布本身依然是 proper 的。

但问题不在这里。

最终想训练的是一个单一的 autoregressive LM。AR-LM 真正对应的链式分解是 $p^*(x_{t+2}\mid x_{\le t+1})$，不是 $p^*(x_{t+2}\mid x_{\le t})$。

对"二步 forecasting 这个子任务"，它可以是正确的；但对"训练一个严格对齐语料联合分布的 AR-LM"，**它问错了问题**。这才是 MTP 的核心偏差。

### 4.1 偏差的数学本质

$$
H(X_{t+2}\mid X_{\le t}) = H(X_{t+2}\mid X_{\le t+1}) + I(X_{t+2};X_{t+1}\mid X_{\le t})
$$

这行式子非常关键。

标准 AR 训练需要的是 $H(X_{t+2}\mid X_{\le t+1})$，而 naive MTP 直接在优化 $H(X_{t+2}\mid X_{\le t})$。两者之间差了一个条件互信息 $I(X_{t+2};X_{t+1}\mid X_{\le t})$——它代表中间那一步 $X_{t+1}$ 对更远未来 $X_{t+2}$ 的决定作用。

naive MTP 恰恰是在试图跳过这一步。于是它把本来必须经过中间状态才能决定的未来，提前压成了"当前 prefix 下的平均未来"。

### 4.2 最小例子：路径被学成摘要

假设语料只有两种 continuation：
- $A \to B \to C$，概率 1/2
- $A \to D \to E$，概率 1/2

标准 NTP 会学到 $q(B\mid A)=1/2$, $q(D\mid A)=1/2$, $q(C\mid AB)=1$, $q(E\mid AD)=1$——先分支，再沿各自路径继续走。

naive MTP 还会要求模型从 A 直接概括两步后的未来：$r_2(C\mid A)=1/2$, $r_2(E\mid A)=1/2$。对 forecasting 本身没错，但它会把共享表征往"看到 A，就先形成一个关于未来的大概摘要"方向推。于是模型更容易学到主题、模板、结构、高层 continuation gist，而更不容易保留当前到底进入了 B 分支还是 D 分支——中间逻辑状态和精细 path identity 被牺牲了。

**MTP 的偏差，是 future-averaging bias。它会把"故事"提前学成"摘要"。**

### 4.3 从训练语料角度看

比如有两类句子：

> A："这家公司利润下滑，主要原因是需求疲软、库存积压、成本上升。"
> B："这家公司利润改善，主要原因是产品升级、渠道优化、费用控制。"

如果模型只看到"这家公司利润……"，训练就要求它同时预测后面更远几步，最容易学到的不是"下滑"和"改善"这两条路径的精确区分，而是一个高层模板——这是业绩分析句，后面会列原因，语气是分析型。

于是生成时，就更容易长成：

> 公司利润变化主要受到市场、产品与成本等多重因素影响。

这句话不能说错，但它已经不是在走原始路径了。它在输出一种平均后的高层摘要句。

所以 MTP 最大的优点和最大的问题来自同一个根——更容易逼出高层语义 feature，也更容易牺牲 path-dependent 的精细状态。

### 4.4 只在较长 prefix 上做启发式 MTP，为什么通常更合理

真正重要的不是"prefix 长"，而是：**到这个位置时，未来是否已经足够收敛。**

prefix 变长，经常意味着路径已经选得差不多了，未来 continuation 的熵变低了。这时做 MTP，偏差就会小很多。

只看到"请帮我写一封……"——后面可能是给 CTO 的延期邮件、给 HR 的请假邮件、给客户的报价说明、给同事的同步消息。这个时候做 MTP 非常危险，因为未来路径还没选定。

但如果已经看到"请帮我写一封给 CTO 的正式邮件，解释版本发布延期的技术原因……"——continuation 已经窄很多。此时让模型多看几步，它更可能学到当前主题、文体、结构、论证方向，而不是去平均完全不同的未来。

所以"长 prefix 启发式 MTP"合理的根本原因不是长度本身，而是它把 MTP 限制在了"未来分支熵已低"的区域。

第一性原理的规则——只在未来已经基本收敛的位置开 MTP，只用短 horizon，越远的 token 权重越低，避开 branch point、转折点、开放式起始段。

**MTP 适合"展开区"，不适合"选路区"。** 这才是它的正确打开方式。


## 5. STP 为什么有偏

STP 和 MTP 的偏法不是一个物种。

MTP 的偏，是 output-space 的偏——改变了在 token-space 里到底在问什么问题。STP 的偏，是 representation-space 的偏——在 hidden 表征空间里加了一个几何先验。

前述 STP 论文的核心主张是所谓 Geodesic Hypothesis：语言序列在语义流形上的隐藏状态轨迹应当局部近似 geodesic，因此可以通过一个 JEPA-style regularizer 把 hidden trajectory 限制在"语义管"附近，把偏离主方向的横向分量当作噪声压制；整个训练目标仍然是 NTP + STP regularizer，不是用 STP 取代 token-level cross-entropy。

**STP 没有改写"下一个 token 的正确答案是什么"；它改写的是"内部状态怎样演化才算好"。**

### 5.1 数学上为什么不再无偏

总目标若为

$$
\mathcal L = \mathcal L_{\text{NTP}} + \lambda \mathcal L_{\text{STP}}
$$

则总体风险的最优解一般不再只是 $q_\theta = p^*$，而是在拟合语料分布的同时，还要尽量让 hidden trajectory 更直、更平滑、更少横向漂移。

只要 $\lambda > 0$，而又没有证明 STP regularizer 不改变 NTP 的最优解集合，或者它只是在一堆 CE-equivalent 解中挑一个几何更好的解，或者 $\lambda$ 在大样本极限下趋于 0——那就不能说它对"学习语料分布"这个目标是严格无偏的。

**STP 不是 unbiased likelihood objective。它是一个 deliberately biased 的 geometric regularizer。**

### 5.2 它到底偏向什么

STP 偏向语义主线稳定、hidden trajectory 低曲率、少横向抖动、少不同轨道之间的漂移和碰撞、更强的 semantic inertia。

直观上，它更像是在说——"一旦已经进入某条语义轨道，就沿着它平稳推进，不要横着乱飘。"

这和 MTP 完全不同。MTP 更像"未来还没展开，就先概括一下未来大概是什么"；STP 更像"未来怎么展开都行，但内部的演化轨迹别太乱"。

### 5.3 从语料角度看

还是那组句子。MTP 的歪法是把两条路径提前平均成"业绩分析模板"。STP 的歪法不是这个——STP 更可能在 hidden space 里施压：一旦当前轨道已经明显是"利润下滑分析"，后面就别横着漂去"利润改善分析"，要沿着当前主线继续推进。所以它更偏向**轨道保持**，而不是未来平均。

但问题也在这里。如果真实高质量文本本来就需要复杂转折——

> 公司利润短期下滑，但利润率改善，主要因为产品结构升级和费用控制。

这类句子本身就不是低曲率直线。它需要先往"下滑"方向走，再合法地折返，再引入更细粒度的结构化判断。STP 若太强，就可能把这种本来应该存在的"必要弯折"当成噪声压掉。

**STP 的偏差 = straightening bias。** 不是把故事学成摘要，而是把故事的 internal trajectory 学得更直。

## 6. NTP 学剧情，MTP 学摘要，STP 学轨道

### 6.1 判断框架

看任何新 loss，只需问三个问题。

**第一问：它优化的对象还是不是语料联合分布？**
如果是，有机会严格无偏。如果不是，一定引入了额外偏好。NTP 属于前者，MTP 和 STP 都不属于。

**第二问：它改的是输出目标，还是表征几何？**
两类偏差不能混为一谈。MTP 改的是 token-space 的监督结构——在未来尚未展开前，就让模型概括更远未来，偏差是 future averaging。STP 改的是 hidden-space 的演化偏好——不直接改"token 对不对"，改"轨迹直不直"，偏差是 trajectory straightening。一个更容易把路径学成模板，一个更容易把思路学得太平、太顺。

**第三问：这个 bias 是否与该位置的真实生成结构一致？**
工程上最重要的一问。不是所有语料都配得上同一种辅助 loss。未来分支熵很低、路径已基本选定的位置，弱 MTP 往往合理；本来就该单主线平稳推进的文本段落，弱 STP 往往合理；sharp branch、合法高曲率、复杂折返区，两者都应该慎用。

Loss 不是越多越好——**给模型的 inductive bias，必须和该位置的真实生成结构相匹配。**

### 6.2 结论

如果目标是严格地让 AR-LM 学到训练语料分布，结论很硬——NTP 干净，MTP 不是，STP 也不是。

但如果目标是在有限数据、有限参数、有限训练预算下，换取更好的表征、结构感和样本效率，结论就没那么二元了——MTP 可能是有益的偏差，STP 也可能是有益的偏差，只是两者偏的方向完全不同。

真正成熟的态度不是"有偏，所以没用"，而是"它偏在哪里？这个偏差和任务结构是否对齐？"这才是工程与理论之间真正该有的接口。

> 本文基于我和GPT-5.4 Pro的对话整理改写。