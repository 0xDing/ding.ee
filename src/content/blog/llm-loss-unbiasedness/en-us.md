---
title: 'The Unbiasedness of LLM Losses: NTP, MTP, and STP'
description: "NTP, MTP, and STP are often compared by asking which one is \"better.\" But better relative to what? Each objective answers a different question. NTP tries to faithfully learn the joint distribution of the training corpus. MTP tries to force out, earlier and faster, a high-level sense of where the continuation is headed. STP tries to make the evolution of hidden states smoother and less prone to lateral drift. These are not the same objective. And \"unbiasedness\" - whether the optimum of a loss coincides exactly with the true distribution of the corpus - is the cleanest criterion for distinguishing them. This essay examines the three objectives through that lens."
pubDate: '2026-04-01'
tags:
  - LLM
heroImage: "cover.jpg"
original: false
---

## 1. What NTP, MTP, and STP Actually Are

### 1.1 NTP: Next-Token Prediction

The standard training objective for an autoregressive language model: given a prefix $x_{<t}$, predict the next token $x_t$.

$$
\mathcal L_{\text{NTP}} = -\sum_t \log q_\theta(x_t \mid x_{<t})
$$

This is still the basic training recipe for almost every decoder-only LLM today. It is very plain, but it has one property that other objectives have a hard time replacing: it lines up exactly with the chain factorization of the corpus joint distribution.

### 1.2 MTP: Multi-Token Prediction

From the current prefix, look several steps ahead at once. In the most naive form:

$$
\mathcal L_{\text{MTP}} = -\log r_{1,\theta}(x_{t+1}\mid x_{\le t}) - \beta_2 \log r_{2,\theta}(x_{t+2}\mid x_{\le t}) - \cdots
$$

The intuition is easy to see: force the model to pick up the topic earlier, form high-level structure earlier, improve data efficiency or representation quality, and reduce the tendency to merely do local token-by-token continuation.

But that is also exactly where the problem begins. It pushes the model to generalize about the future too early.

### 1.3 STP: Semantic Tube Prediction

STP comes from a February 2026 arXiv paper, *Semantic Tube Prediction: Beating LLM Data Efficiency with JEPA* (Hai Huang, Yann LeCun, Randall Balestriero). What it proposes is not multi-step prediction in token space, but a JEPA-style hidden-state regularizer: it assumes that the hidden trajectory of language on a semantic manifold should stay locally close to a geodesic, and then uses a "semantic tube" constraint to keep hidden-state evolution near that geodesic. The full objective is standard NTP cross-entropy plus an STP regularizer. The paper reports that, in its experimental setting, STP can reach near-baseline performance with less training data.

The key distinction is this: **STP does not directly change token supervision. It changes the geometric preference of the hidden representation space.** That is fundamentally different from MTP.

## 2. What "Unbiasedness" Means Here

"Unbiased" means different things in different contexts. In this essay, the definition is the following.

### 2.1 Mathematical Definition

Assume the training corpus is drawn from a true distribution $p^*(x_{1:T})$. Let the model be

$$
q_\theta(x_{1:T})=\prod_t q_\theta(x_t\mid x_{<t})
$$

For a training objective $\ell(x;\theta)$, define the population risk as

$$
\mathcal R(\theta)=\mathbb E_{x\sim p^*}[\ell(x;\theta)]
$$

If the minimizer of the population risk happens to satisfy

$$
q_\theta(x_t\mid x_{<t}) = p^*(x_t\mid x_{<t}) \quad \forall t
$$

that is, $q_\theta(x_{1:T}) = p^*(x_{1:T})$,

then we say the loss is **unbiased** for the objective of "learning the distribution of the training corpus."

In other words: is the thing being optimized the same thing as "getting the corpus distribution exactly right"?

### 2.2 Intuition

Unbiased means that the question asked during training is the same as the question that must actually be solved at inference time.

For a standard AR-LM, inference works like this: observe the real historical prefix -> predict the next token -> append it to the context -> continue predicting. If training is also doing "given the real prefix, predict the real next token," then the training objective is aligned with the generation mechanism.

But if training asks "given the current prefix, summarize what happens two or three steps later in advance," or "even when token prediction is correct, force the hidden trajectory to be straighter and smoother," then extra preferences have been injected into training. Those preferences may be useful, but they are no longer strictly unbiased.

## 3. Why NTP Is Unbiased

This is the cleanest case of the three.

The NTP loss is

$$
\mathcal L_{\text{NTP}} = -\sum_t \log q_\theta(x_t\mid x_{<t})
$$

By the chain rule, $q_\theta(x_{1:T})=\prod_t q_\theta(x_t\mid x_{<t})$, so

$$
-\sum_t \log q_\theta(x_t\mid x_{<t}) = -\log q_\theta(x_{1:T})
$$

Taking expectation under the true data distribution gives

$$
\mathcal R_{\text{NTP}} = \mathbb E_{p^*}[-\log q_\theta(x_{1:T})] = H(p^*) + \mathrm{KL}(p^* \| q_\theta)
$$

$H(p^*)$ is a constant, so what is actually being optimized is $\mathrm{KL}(p^* \| q_\theta)$. The population risk reaches its minimum if and only if $q_\theta = p^*$.

**NTP is not merely a "reasonable enough" training objective. It is exactly the chain-form expansion of maximum likelihood for the corpus joint distribution.**

That is why it occupies a very special position. Other losses may be useful, but it is hard for them to be this clean at the objective level.

A more intuitive way to say it is this: NTP learns the plot. It first sees A, then decides B; under AB, it then decides C. It does not try to skip steps, and it does not try to compress the future into a summary too early. It strictly respects the path dependence of language generation.

## 4. Why MTP Is Biased

If you separately train a "two-step prediction head" to fit $p^*(x_{t+2}\mid x_{\le t})$, that head is not necessarily biased for its own forecasting objective. Cross-entropy is still proper for that conditional distribution itself.

But that is not the real issue.

What we ultimately want is a single autoregressive LM. The chain factorization that actually corresponds to an AR-LM is $p^*(x_{t+2}\mid x_{\le t+1})$, not $p^*(x_{t+2}\mid x_{\le t})$.

For the subtask of "two-step forecasting," it can be correct. But for the task of "training an AR-LM that is strictly aligned with the corpus joint distribution," **it is asking the wrong question.** That is the core bias of MTP.

### 4.1 The Mathematical Core of the Bias

$$
H(X_{t+2}\mid X_{\le t}) = H(X_{t+2}\mid X_{\le t+1}) + I(X_{t+2};X_{t+1}\mid X_{\le t})
$$

This identity is the key.

Standard AR training needs $H(X_{t+2}\mid X_{\le t+1})$, whereas naive MTP directly optimizes $H(X_{t+2}\mid X_{\le t})$. The gap between them is the conditional mutual information $I(X_{t+2};X_{t+1}\mid X_{\le t})$. It captures how much the intermediate step $X_{t+1}$ matters for determining the farther future $X_{t+2}$.

Naive MTP is trying to skip exactly that step. So it compresses into the current prefix what should only become determined after passing through the intermediate state: the average future under the current prefix.

### 4.2 A Minimal Example: The Path Gets Learned as a Summary

Suppose the corpus has only two continuations:

- $A \to B \to C$, with probability 1/2
- $A \to D \to E$, with probability 1/2

Standard NTP will learn $q(B\mid A)=1/2$, $q(D\mid A)=1/2$, $q(C\mid AB)=1$, $q(E\mid AD)=1$. It branches first, then keeps moving along each path.

Naive MTP also asks the model to summarize, directly from A, what lies two steps ahead: $r_2(C\mid A)=1/2$, $r_2(E\mid A)=1/2$. That is not wrong for forecasting itself, but it pushes the shared representation toward this tendency: "when I see A, I should first form a rough summary of the future."

As a result, the model more easily learns topic, template, structure, and the high-level gist of the continuation, while becoming less inclined to preserve whether it has actually entered the B branch or the D branch. Intermediate logical state and fine-grained path identity get sacrificed.

**The bias of MTP is future-averaging bias. It tends to learn the story as a summary before it learns it as a path.**

### 4.3 Looking at It from the Corpus

Suppose there are two kinds of sentences:

> A: "This company's profits declined, mainly because of weak demand, excess inventory, and rising costs."
> B: "This company's profits improved, mainly because of product upgrades, channel optimization, and cost control."

If the model has only seen "This company's profits ...", and training already asks it to predict farther ahead, then the easiest thing to learn is not the precise distinction between the "declined" path and the "improved" path. What it learns most easily is a higher-level template: this is an earnings-analysis sentence, it will list reasons, and the tone is analytical.

Then at generation time, it is more likely to produce something like:

> Changes in the company's profits were influenced by multiple factors, including the market, product decisions, and costs.

That sentence is not exactly wrong. But it is no longer following the original path. It is outputting an averaged high-level summary sentence.

So MTP's greatest strength and greatest weakness come from the same root. It more easily forces out high-level semantic features, and it more easily sacrifices fine-grained path-dependent state.

### 4.4 Why Heuristic MTP on Longer Prefixes Is Usually More Reasonable

What really matters is not that the prefix is long. What matters is this: **by that point, has the future already converged enough?**

When the prefix becomes longer, it often means the path has already been mostly chosen, and the entropy of the future continuation is lower. In that regime, MTP introduces much less bias.

If the model has only seen "Please help me write an email ...", the continuation could be a delay note to a CTO, a leave request to HR, a pricing explanation for a client, or a status update to a coworker. In that case MTP is very risky, because the future path has not been selected yet.

But if the model has already seen "Please help me write a formal email to the CTO explaining the technical reasons for the delayed release ...", then the continuation is much narrower. Asking the model to look a few steps ahead is now more likely to help it learn the theme, style, structure, and argumentative direction, rather than average over completely different futures.

So the fundamental reason that "long-prefix heuristic MTP" is often more reasonable is not length itself. It is that this restricts MTP to regions where the branch entropy of the future is already low.

The first-principles rule is: turn on MTP only where the future has already mostly converged, use only short horizons, give lower weight to more distant tokens, and avoid branch points, turning points, and open-ended beginnings.

**MTP is suited to expansion zones, not route-selection zones.** That is the right way to use it.

## 5. Why STP Is Biased

STP and MTP are not biased in the same way.

MTP's bias lives in output space. It changes what question is being asked in token space. STP's bias lives in representation space. It adds a geometric prior over hidden representations.

The core claim of the STP paper is the so-called Geodesic Hypothesis: the hidden-state trajectory of a language sequence on the semantic manifold should be locally close to a geodesic. So a JEPA-style regularizer can constrain the hidden trajectory to stay near a "semantic tube," treating lateral components that deviate from the main direction as noise to be suppressed. The training objective remains NTP + an STP regularizer. STP does not replace token-level cross-entropy.

**STP does not rewrite "what is the correct next token?" It rewrites "what kind of evolution of internal state should count as good?"**

### 5.1 Why It Is No Longer Unbiased Mathematically

If the full objective is

$$
\mathcal L = \mathcal L_{\text{NTP}} + \lambda \mathcal L_{\text{STP}}
$$

then in general the optimum of the population risk is no longer just $q_\theta = p^*$. It must both fit the corpus distribution and make the hidden trajectory as straight, smooth, and free of lateral drift as possible.

As long as $\lambda > 0$, and there is no proof that the STP regularizer leaves the set of NTP optima unchanged, or that it merely selects one geometrically nicer solution among CE-equivalent optima, or that $\lambda$ goes to 0 in the large-sample limit, then STP cannot be called strictly unbiased for the objective of learning the corpus distribution.

**STP is not an unbiased likelihood objective. It is a deliberately biased geometric regularizer.**

### 5.2 What It Is Actually Biased Toward

STP biases toward a stable semantic main line, low-curvature hidden trajectories, less lateral wobble, less drift and collision between different tracks, and stronger semantic inertia.

Intuitively, it is saying something like this: "once you have entered a semantic track, keep moving along it smoothly, and do not drift sideways."

This is completely different from MTP. MTP is more like "before the future has unfolded, summarize roughly what the future is." STP is more like "the future can unfold however it wants, but do not let the internal evolution get too messy."

### 5.3 Looking at It from the Corpus

Take the same pair of sentences again. MTP distorts them by prematurely averaging two paths into an "earnings-analysis template." STP does not work like that. STP is more likely to exert pressure in hidden space such that, once the current track is clearly "profit decline analysis," the model should not drift sideways into "profit improvement analysis." It should keep advancing along the current main line. So STP is more biased toward **trajectory preservation**, not future averaging.

But the problem is also right there. If genuinely high-quality text naturally requires complex turns, such as:

> The company's profits declined in the short term, but its profit margin improved, mainly because of product-mix upgrades and cost control.

then the sentence itself is not a low-curvature straight line. It first has to move in the "decline" direction, then bend back legitimately, and then introduce a finer-grained structured judgment. If STP is too strong, it may suppress exactly these necessary bends as noise.

**The bias of STP is straightening bias.** It does not learn the story as a summary. It learns the story's internal trajectory as straighter than it really is.

## 6. NTP Learns Plots, MTP Learns Summaries, STP Learns Trajectories

### 6.1 A Practical Framework for Judgment

To evaluate any new loss, ask only three questions.

**Question 1: Is the thing being optimized still the joint distribution of the corpus?**
If yes, then it has a chance to be strictly unbiased. If not, then extra preferences have definitely been introduced. NTP belongs to the first case. MTP and STP do not.

**Question 2: Does it alter the output objective, or the geometry of representation?**
These two kinds of bias should not be conflated. MTP changes the supervision structure in token space: before the future has unfolded, it asks the model to summarize farther-out futures, and the bias is future averaging. STP changes the preference governing the evolution of hidden-space states: it does not directly change whether a token is right, but whether the trajectory is straight, and the bias is trajectory straightening. One is more likely to turn paths into templates. The other is more likely to flatten reasoning into something too smooth and too linear.

**Question 3: Is that bias consistent with the true generative structure at that position?**
This is the most important question in practice. Not all corpora deserve the same auxiliary loss. Where future branch entropy is already low and the path has basically been chosen, weak MTP is often reasonable. Where the text really should advance steadily along a single main line, weak STP is often reasonable. In sharp branching regions, legitimate high-curvature regions, or areas with complex reversals, both should be used cautiously.

Loss is not better just because there is more of it. **The inductive bias you give the model must match the true generative structure at that position.**

### 6.2 Conclusion

If the goal is to make an AR-LM learn the training corpus distribution strictly, then the conclusion is hard: NTP is clean, MTP is not, and STP is not.

But if the goal is to trade some bias for better representations, stronger structure, and higher sample efficiency under finite data, finite parameters, and finite training budget, then the conclusion is no longer so binary. MTP may be a useful bias. STP may also be a useful bias. They are simply biased in very different directions.

The mature stance is not "it is biased, so it is useless," but "where is it biased, and does that bias align with the structure of the task?" That is the real interface between theory and engineering.

> This essay is adapted and rewritten from my conversation with GPT-5.4 Pro.
