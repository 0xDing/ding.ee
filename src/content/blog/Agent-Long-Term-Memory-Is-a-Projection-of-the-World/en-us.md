---
title: "More Than Chat Logs: An Agent's Long-Term Memory Is a Projection of the World"
description: "Two years ago you said you loved barbecue. Last month you went vegetarian. Your agent still booked a Brazilian steakhouse. The model isn't the problem; the memory is. Most agent memory today is, at best, a chat archive with a search box. Long-term memory should be a projection of the world that keeps getting revised as evidence comes in: it learns from conversations and from the world beyond them, keeps perspectives apart, lives in a graph, generalizes, and forgets."
pubDate: '2026-06-01'
tags:
  - Agent
  - Long-Term Memory
heroImage: "cover.jpg"
original: false
---

Two years ago, you told your agent, "I love barbecue." Last month, you told it, "I've gone vegetarian." Today you ask it to pick a place for a team dinner, and it confidently books a Brazilian steakhouse.

Most people's first reaction is that the model got dumber. It didn't. The problem is the memory system underneath it.

Nearly everyone builds agent memory the same way: chop up what's been said, turn the chunks into vectors, and dump them all into a vector database. When it's time to remember, embed the current question, pull the nearest few chunks, and hand them to the model. But vector space only knows near and far. It knows nothing about before and after, nothing about cause and effect, and certainly nothing about a new statement replacing an old one. "I love barbecue" and "I've gone vegetarian" both come back as two points of equal standing. The system can't tell which one still holds, so it simply goes with whichever sits closer to "restaurant."

That's a chat archive with a search box, not memory. Memory isn't storage, and it isn't retrieval either.

Ankole is an open-source project I've been building lately: an enterprise Agent Harness whose core is a Company Brain for digital employees. Most of my time on it has gone into working out how that brain should remember things, and the deeper I get, the surer I am of one thing. An agent's long-term memory shouldn't be a pile of conversation logs. It should be a projection of the world, constantly reasoned over and constantly revised as evidence comes in.

## Memory is inferred, not stored

If you've done any backend work, you probably know event sourcing. The database keeps an append-only log of events instead of the final state. An account balance, the stage an order has reached: all of it is derived by replaying the log, and that derived view is called a projection.

Human memory works the same way. The brain has never been a video recorder. Every time you remember something, you rebuild the past from fragments, using whatever cues you have at hand. Your sense of a longtime colleague isn't a tape of every meeting; it's a running picture of what kind of person they are, which you adjust a little whenever they do something new. Nobody goes back and rewinds the tapes.

An agent's memory should have two layers too. The bottom layer is evidence: who said what and when, which earnings report it read, which news story it picked up. Evidence is append-only, never edited, and always there to check. The top layer is understanding, which is to say the world projection: the current conclusions drawn from all that evidence. Does this person eat meat these days? Is that company reworking its supply chain? When new evidence arrives, an old conclusion either gets patched or gets thrown out.

A system that only stores chat logs puts the whole burden of reasoning on the model at the moment someone asks a question. At that moment the model sees a handful of retrieved fragments. It can't see the timeline and can't untangle cause and effect, so it's no surprise when it gets things wrong. Vector search only finds things; memory has to be reasoned out.

## The world doesn't wait for you to ask

Most discussion of agent memory circles around the human–AI conversation: work out the user's preferences, feedback, and expectations from chat, then use engineering tricks to stretch the usable context until it's practically unbounded. OpenViking and similar projects all do roughly this. It's useful, but nowhere near enough.

An LLM's knowledge stops at a cutoff, and the model knows nothing about what has happened in the world since. You might say: just hook it up to a search engine. It's not that simple. Traditional RAG has a blind spot: if you don't know what matters, you don't know what to search for. Take crude oil futures research. If the system doesn't know that war has broken out between the US and Iran, it will never think to search for "Strait of Hormuz" on its own. Without that background, a search engine sitting right there is just decoration.

A junior analyst and a ten-year veteran use the same Google and the same Bloomberg terminal. What sets the veteran apart is a living map of the world in their head: which companies sit upstream and downstream of which, which straits the tankers have to squeeze through, how a central bank rate cut ripples out to which sectors. That map tells the veteran where to look.

So an agent's memory needs two input channels of equal standing. One is conversation: listening to people and picking up on their intentions and habits. The other is events: keeping watch on the outside world, from policy changes and earnings releases to price swings and industry shake-ups. If the central bank announces a rate cut, the agent's view of the affected assets should update even if nobody in the group chat mentions it. And when someone asks, the agent should be able to sit down with a book or a forty-page research report and digest what it learns into memory.

A world projection isn't the world itself, and it's certainly not a rigid archive of logs. It's the agent's current working model of the world. New evidence fills in, corrects, or replaces old understanding, while forgetting, pruning, generalizing, and merging keep the model as close as possible to the world as it is now. The relationship graph is only one part of it; facts, and how they change over time, have to be maintained alongside it.

## Why it has to be a graph, and a constrained one

So what does this projection look like? A graph.

The trouble with vector search is that it chops information too fine. Put "salmon," "sea urchin," and "sushi" into a vector database and you get three isolated points floating in high-dimensional space. Geometric distance can't gather them into "this person is into Japanese food," and there's no way to draw an arrow between points to mark that "vegetarian" has superseded "barbecue." Everything memory needs to do, from distilling and evolving to catching contradictions, comes down to relationships. Vectors are points; only a graph is a network.

In a graph, "crude oil" and "US–Iran war" are joined by a direct edge. When the agent looks into crude oil, the related events surface along that edge, no lucky guess at search terms required.

But a graph can't just connect anything to anything. GraphRAG extracts entities that co-occur in text, with no type constraints. In an ordinary graph database, "Coca-Cola likes pizza" is a perfectly legal edge, and the database won't stop you. Let a model extract relations freely and absurd edges like that, conjured up by hallucination, spread like weeds.

Here Palantir's ontology was a big inspiration: give relationships rules. First decide which entity types exist in the world, such as companies, indexes, events, and people. Then pin down which relationships may connect which types. "Contains," for example, may only point from an index to a company. With a typed skeleton like that, the model can't draw lines wherever it pleases during extraction.

Pure ontology has a fatal flaw of its own: it can hold only explicitly declared facts. Judgments that are inferred, and that keep evolving, don't fit. It's precise, but it's dead. Ontology is the skeleton: it defines which entities and relationships make up the world. Reasoned memory is the flesh: it says what is happening on that skeleton and what it means. A skeleton without flesh is a dead knowledge base; flesh without a skeleton is a heap of disorganized memory fragments.

There's one place where I fundamentally part ways with Palantir. Palantir designs its ontology top-down, in advance. The world an agent sees has to grow from the bottom up. Business never stops changing: today you only need to track "company" and "index," and tomorrow "geopolitical policy" or "supply-chain chokepoint" turns up. Wait for an architect to think through every type before you start, and the system is dead before it ships. My approach is to start top-down and evolve bottom-up: run with a small set of general types, tag new concepts as they appear, and once a concept keeps coming up and enough evidence has piled up, have the system propose promoting it to a first-class type, for a human to sign off on. Forgetting, pruning, generalizing, and merging keep reshaping the ontology, bit by bit.

## Perspective: who sees whom, who's in the room, who gets to hear it

You as your coworkers see you, you as your parents see you, and you as you see yourself are three very different pictures. Each has its own history; they may contradict one another, yet each makes sense on its own terms. An agent's memory should work the same way: for any given entity, keep track separately of how each party sees it.

With a single-user assistant, this hardly comes up. Put agents into a company group chat and it gets complicated fast. A group holds several people and several digital employees, and information flows many-to-many. The system has to answer more than "What does this agent remember about this user?" It has to keep straight who said what to whom, which understanding the whole group shares, and which belongs to only a few people.

Say Alice grumbles in the group chat, "Bob is unreliable." If the memory system simply files away "Bob is unreliable," one person's opinion becomes a fact for the whole organization, and Bob gets smeared in the system for no reason. Every piece of understanding has to be tied to two things:

- **Is it a fact or a judgment?** "Q4 revenue grew 15%" is a fact you can check. "The overseas business is starting to pay off" is a judgment. Judgments take time to prove out, and once the verdict is in, someone has to go back and settle the score: whose calls were right?
- **Whose judgment is it?** "Bob is unreliable" can't be pinned on Bob. It goes under Alice's name: it's what Alice thought at a particular moment.

I treat group chats as the scenario that matters most because a company's most valuable assets usually aren't written down anywhere. Which department really calls the shots, which client you have to approach without going through a certain middle manager, which metric looks great but is padded: this kind of tacit knowledge is scattered across everyday conversation, and the bigger the organization, the more that's true. It's why layoffs at big companies so often hit an artery. What walks out the door is usually a whole map of relationships in someone's head that nobody ever drew; the lost headcount is the smaller loss.

Perspective also brings up a more practical line of defense: what can be said in front of whom. An agent is an AI coworker, not anybody's mouthpiece, and it plays by the same rules as its human colleagues. Who is entitled to know a piece of knowledge depends on the visibility scope that piece carries, and before the agent speaks up, it also checks who's in the room. What's fine to say among insiders, the agent has to keep to itself once an outside consultant joins the group. Knowledge belongs to the organization, not to any one agent, so if a digital employee is retired one day, the organization's memory doesn't walk out with it.

## Dreaming and forgetting

When a log only ever grows, the system sooner or later drowns in trivia. As I see it, being able to forget is itself an important part of human intelligence. If every piece of information kept the same weight forever, what really matters would sink to the bottom, and the agent's projection of the world would drift further and further out of shape.

To let memory metabolize on its own, I added an offline batch process called Dreaming, named after what people do in their sleep: the day's experiences get sorted out overnight. It does three things:

- **Induction and deduction.** It gathers scattered observations and reasons upward. Given "likes salmon" and "likes tuna," the system distills "this person is probably into Japanese food" and attaches the evidence, but treats it as an inference, not a fact; later evidence will confirm it, correct it, or overturn it. Deduction draws conclusions useful for the task at hand from existing facts, rules, and relationships, and the ones with lasting value get written back into memory.
- **Sorting out contradictions.** When a user moves, "lives in New York" should evolve into "lived in New York from 2019 to 2024, in Seattle since 2024." The two conflicting records can't just sit side by side, and the new one can't simply overwrite the old one either. When a conflict is genuinely unclear, the system doesn't quietly change anything; it writes the conflict up and puts it in front of a person to make the call.
- **Tiered forgetting.** Forgetting isn't physical deletion. It's down-weighting and cooling until a memory drops out of default recall. Events fade over weeks, preferences over months, facts over years. That "I love barbecue" from two years ago went cold long ago; last month's "I've gone vegetarian" is still warm. That decay alone is enough to keep the agent from booking the Brazilian steakhouse again.

## The big picture

Put it all together and it looks roughly like this:

```text
Conversations & group chats · news, papers, web pages & data · external events
          │
          ▼  Learning: extract claims; record source, time, whose view, who may know
Entities · facts · judgments · timelines · relationships (ontology)
          │  ▲
          │  └─ Dreaming: induce, deduce, forget, prune, merge; evolve the ontology
          ▼
Recall: full-text + vectors + expansion along relationships
          │
          ▼  Take only what the asker may know; say only what everyone present may hear
        Agent
```

## Coda

In the end, what large models do best is reason, not memorize by rote. Deep reasoning wears people out, and fatigue, prejudice, and emotion pull us off course. A model carries no such baggage: give it enough premises and it will keep reasoning, tirelessly and consistently. An agent's memory can get past our biological limits, not by remembering more, but by reasoning deeper.

All of these ideas went into Ankole's Company Brain. The code is fully open source, down to how memories are stored, how the reasoning runs, and how Dreaming dreams, so if you're curious, have a look at [AgentBull/ankole](https://github.com/AgentBull/ankole) on GitHub. There's a long road ahead, and help is welcome.
