---
title: 'Judgment Without Words: Some Biased Notes on Bongard and Machine Intuition'
description: "Using an LLM for a branching decision in real software means waiting through a few hundred tokens of chain of thought, then parsing a fragile JSON object off the end, all to get one boolean. Bongard is a judgment model I built on an encoder–decoder: a long state is encoded once, dozens of questions share that encoding, and a bilinear head turns them straight into probabilities. Inference never generates a single token. This post covers why I avoided decoder-only models, and how training got past representation collapse and probability calibration."
pubDate: '2026-10-06'
tags:
  - LLM
  - Agent
original: false
heroImage: "cover.jpg"
---

Large language models are great at conversation. Use one to make branching decisions inside real software, though, and it's a miserable experience.

Over more than a year of building Ankole, a digital-employee system, I've been driven up the wall by this kind of situation more times than I can count. Before an agent can act on a web page or route a ticket, the system has to know something like "can this button be clicked right now?" or "should this email go to the risk team?" To get that one boolean or category label, the usual approach is to hand the entire context to a model with billions, sometimes tens of billions, of parameters, wait while it autoregressively writes out a few hundred tokens of chain of thought, and finally parse a fragile JSON object off the end.

It takes two or three seconds and adds a few thousand tokens to the bill, and if the formatting wobbles even slightly along the way, the downstream parser throws an error.

There's something mechanically wrong with this. When people make everyday decisions, they never need to recite their reasoning to themselves one sentence at a time. An ER doctor reads an ECG, a seasoned driver changes lanes at an intersection, a blitz player makes a move, and each of these happens in an instant. Kahneman called this System 1: pattern recognition done directly at the level of perception, built on long accumulated experience, with no explicit language in between.

TypeSafe recently released Jev and formally named this class of model "System One." They're coming at it from the right angle. But on how to actually build such a model, and on where the open-source ecosystem goes from here, I disagree sharply with the current mainstream.

Over the past few months the open-source community has produced a pile of projects reproducing Jev, and almost without exception they do the same thing: take a decoder-only causal model like Qwen, attach a LoRA, write "Choose from A, B, or C" in the prompt, and at inference time read off the logits for those letters at the first token position to compute probabilities.

I've built and tested setups like this. My conclusion is that the approach simply doesn't work.

The first problem is **prior contamination**. Pretraining leaves a causal model with strong probability preferences among the letters in its vocabulary, and whether an option appears early or late in the list changes the output enormously. No amount of post-hoc temperature tuning can paint over that undercoat.

The deeper problem is **a mismatch in the shape of the computation**. The data in a decision task is lopsided. The state that serves as evidence (a contract thousands of words long, a system's call stack, a web page's DOM tree) is usually long, and every word of it has to be read against everything around it. The questions you want to ask of that evidence are often several, sometimes dozens, and each one is short.

Have a causal language model read a long state, and the one-way causal mask is like making it read code left to right with a blindfold on: earlier tokens never get to see what comes after them. And even if you prefix-cache the state, when many questions are fired at the same state in parallel, the decoder's self-attention compute still can't be avoided.

So when I built **Bongard**, I stayed away from decoder-only architectures entirely and chose the one most people overlook: an encoder–decoder, with `T5Gemma 2 4B-4B` as the base model.

The intent behind this topology is simple. A state of several thousand tokens goes through the bidirectional encoder exactly once, and its full context is encoded into a dense key-value cache. The $N$ specific questions about that state then proceed independently in the decoder, all sharing the state the encoder produced. At the tail end of the decoder, I attached a bilinear decision head with just 1.3 million parameters. It reads the product of each candidate's hidden state and the global decision state, and a single softmax maps that to probabilities.

**At no point during inference does the model generate a single token.**

As a result, making 32 judgments in a row on the same long state takes Bongard only 221 milliseconds (about 6.9 ms per decision), which works out to roughly \$4.40 of GPU compute per million judgments. More importantly, the encoder's bidirectional view means the model no longer has blind spots when it reads tables or code. We ran an ablation: when we forced the encoder onto a one-way causal mask, downstream decision accuracy fell by a full 5 percentage points, and negative log-likelihood (NLL) became four times worse.

Once the architecture was settled, the real battle was training.

For a model that never emits a word, the biggest pitfall is **collapse of the hidden-layer representations**.

Ordinary supervised fine-tuning (SFT) can only teach a model to pick the right answer to particular questions; it can't teach robust semantic understanding. The model is very quick to take shortcuts: choose whichever option is longest, or memorize one particular way of phrasing the question. Reword the same question and the output probabilities swing wildly.

To teach the model "semantic invariance" across different phrasings, the ideal route is the one laid out by Yann LeCun's JEPA (Joint-Embedding Predictive Architecture): instead of predicting specific words, have semantically equivalent states predict one another in the hidden layers.

But when we actually started on Stage 2, we ran into a big problem the textbooks don't mention.

In an ordinary language model, representation alignment has the next-word prediction task underneath it as a safety net. A next-token loss over a 260,000-token vocabulary is a powerful anchor, holding the hidden states down so they can't drift. Bongard, though, never emits a word. When we tried the usual approach of pulling paraphrases together with cosine similarity, the metrics came out very strange: **deep inside the model, two random passages with nothing whatsoever to do with each other had a raw cosine similarity that held steady at around 0.99.**

This is extreme anisotropy in high dimensions: every vector is squeezed into an extremely narrow cone. Apply a cosine loss to them directly and nearly all of the gradient goes into pushing every vector in the same direction, and the model almost immediately loses its ability to tell things apart.

To pull the representations apart without a vocabulary to anchor them, we added in-batch centering (pack centering). For each training batch, we first compute the mean of all samples' hidden states and subtract it outright, stripping out that inflated global offset. At the same time, for each multiple-choice question, we take the question's decision state as the anchor and contrast the event states for "the correct option is true" and "a wrong option is false." Because the positive and negative events share the same evidence and the same prompt template, subtracting one from the other cancels the template's own lexical fingerprint out completely. What's left in the gradient is only the core direction that separates right from wrong.

With the representations cleaned up, accuracy on paraphrased questions the model had never seen rose from 75.7% to 85.9%, and the probability variance caused by changes in phrasing was all but smoothed away.

In Stage 3, the problem became **probability calibration**.

Many classifiers trained with reinforcement learning share the same affliction: wild overconfidence. They're only 60 or 70 percent sure, yet the probability they output has to hit 99.9%. If standard policy gradient gets nothing but a 0-or-1 win/loss as its reward, then the math of maximizing return inevitably forces the model to push its top-scoring option toward absolute certainty.

In an automated system, though, we badly need the model to know when it doesn't know.

So in this stage we dropped the model into sandboxes: Minesweeper, 2048, Othello, browser environments. Instead of a made-up reward model, we used exact dynamic-programming solutions or Monte Carlo sampling to get the true win-rate distribution of each candidate action in the environment, then supervised the decision head with proper scoring rules such as the Brier loss. Mathematically, only under full-distribution supervision does the fixed point of the policy gradient dutifully converge to the environment's true probabilities.

One very concrete effect of this training shows up in how the model responds to randomness.

We had several mainstream LLMs (DeepSeek, Qwen, Llama, and others) call a coin toss, or guess the roll of a ten-sided die. Over dozens of trials, they stubbornly predicted heads, or a 7, almost 100% of the time. The pretraining corpora of autoregressive models are full of preference patterns like these, and the models can't produce a truly uniform distribution. Bongard, given a coin toss, returns `heads: 0.500, tails: 0.500` every time, and on the ten-sided die its divergence from a uniform distribution averages just 0.0009.

Finally, the compute engineering.

We don't have a big cluster. Bongard has 7.09 billion parameters, and all of them were trained on a **single NVIDIA Blackwell GPU**. The three stages took roughly 51, 23, and 11 hours respectively.

Fitting full-parameter post-training of a 7B model onto one card came down to some fairly aggressive kernel-level engineering. The FFN blocks run entirely on Transformer Engine's fused NVFP4 kernels, more than twice as fast as FP8 at a sequence length of 8192. The attention projections run in FP8 with row-wise scaling. Input data is packed into variable-length sequences with no padding, and FlashAttention-4's causal masking takes care of self-attention and cross-attention in a single pass. The optimizer is 8-bit AdamW with stochastic rounding, which saves the memory a full FP32 master copy of the weights would take.

With training complete, Bongard scored 78.05% accuracy on DecisionBench, a public decision benchmark of 23,900 questions. That ranks fourth out of 61 systems (the top three are the leaderboard authors' own models and Imajev-4B), ahead of GPT-5.6 Luna and DeepSeek V4.1 Flash. More important, its expected calibration error (ECE) is 0.063, far more honest than the closed-source Jev's 0.128.

A word about the name. I called it Bongard because the visual puzzles Mikhail Bongard designed in the 1960s are my favorite set of thought experiments in cognitive science. Douglas Hofstadter spends many pages on them in *Gödel, Escher, Bach*. Two groups of pictures sit in front of you, without a word of description, and yet a person can spot at a glance the hidden line that divides them.

Diogo named their model Jev, after Jevons, the economist behind the Jevons paradox. That name frames the question in economic terms, around the scale effects that follow when automation drives costs down. I'm more inclined to look at it from the structure of cognition itself: machine thinking shouldn't be held hostage to a single sequence of words.

Separate nonverbal intuition out, turn it into a basic building block that is low-latency, highly concurrent, and probabilistically self-consistent, and let slow autoregressive thinking step in only where real deliberation is needed. Only then does a complex system of digital employees have a real chance of working in production.

The paper is at [arXiv:2609.39111](https://arxiv.org/abs/2609.39111), the weights are on Hugging Face ([AgentBull/bongard-mini](https://huggingface.co/AgentBull/bongard-mini)), and the serving runtime is open source on GitHub ([AgentBull/bongard](https://github.com/AgentBull/bongard)). If the architecture interests you, have a look through the code in the repo.
