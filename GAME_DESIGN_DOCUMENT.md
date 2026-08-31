# DEAL ROOM: The Mergers & Acquisitions Simulation
## Comprehensive Game Design Document

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Game Philosophy & Vision](#2-game-philosophy--vision)
3. [Target Audience Analysis](#3-target-audience-analysis)
4. [Game Overview](#4-game-overview)
5. [Role System](#5-role-system)
6. [Game Phases — Detailed Breakdown](#6-game-phases--detailed-breakdown)
7. [Card Systems](#7-card-systems)
8. [Financial Engine](#8-financial-engine)
9. [Legal Mechanics Engine](#9-legal-mechanics-engine)
10. [Negotiation System](#10-negotiation-system)
11. [Scoring & Victory Conditions](#11-scoring--victory-conditions)
12. [Scenario Library](#12-scenario-library)
13. [Game Modes](#13-game-modes)
14. [Educational & CLE Integration](#14-educational--cle-integration)
15. [Component Design](#15-component-design)
16. [Digital Platform Architecture](#16-digital-platform-architecture)
17. [Monetization & Distribution](#17-monetization--distribution)
18. [Development Roadmap](#18-development-roadmap)

---

# 1. EXECUTIVE SUMMARY

**Deal Room** is a high-fidelity Mergers & Acquisitions simulation game designed for legal professionals, investment bankers, private equity professionals, and advanced finance students. Unlike existing business board games that simplify transactions into dice rolls, Deal Room replicates the actual decision-making complexity of real M&A transactions — from initial target screening through post-closing integration disputes.

The game is built around the principle that **every decision has a trade-off**, mirroring the reality that M&A professionals face daily. Speed vs. thoroughness in diligence. Aggressive deal terms vs. deal certainty. Short-term wins vs. long-term reputation.

**Key Differentiators:**
- Realistic legal document mechanics (MAC clauses, rep & warranty negotiations, indemnification structures)
- Genuine financial modeling decisions (not simplified abstractions)
- Role asymmetry creating natural tension between players
- Scenario deck based on patterns from landmark real-world transactions
- Suitable for both entertainment and professional training (CLE credits, deal team exercises)

**Player Count:** 4–8 players (expandable to 12 with team play)
**Play Time:** 90 minutes (Speed Round) to 4 hours (Full Deal) to multi-session campaigns
**Complexity:** High (target audience is professionals who live this daily)

---

# 2. GAME PHILOSOPHY & VISION

## 2.1 Design Principles

### Principle 1: Authenticity Over Simplification
Every mechanic in the game maps to a real-world M&A concept. We do not abstract away complexity — we make it playable. A lawyer should recognize the MAC clause negotiation in the game as substantively similar to what they draft in practice.

### Principle 2: Incomplete Information Drives Strategy
Real deals are defined by what you don't know. The game creates information asymmetry between players through hidden cards, sealed bids, and private objectives. No player ever has the full picture — just like reality.

### Principle 3: Time Is The Enemy
Real deals have momentum. Delays kill transactions. The game uses timed phases and escalating costs to replicate deal fatigue and the pressure to close.

### Principle 4: Relationships Carry Over
In the real M&A market, your reputation follows you. The game's reputation system ensures that how you behave in one deal affects your options in the next. Scorched-earth tactics have a price.

### Principle 5: No Guaranteed Outcomes
Even well-structured deals can fail. Regulatory surprises, market crashes, activist interventions, and buyer's remorse are all possible. The best strategy maximizes expected value, not guaranteed outcomes.

## 2.2 Experience Goals

Players should walk away feeling:
- The tension of a live negotiation with real stakes
- The intellectual satisfaction of structuring a complex deal
- The frustration of discovering a hidden liability after signing
- The thrill of winning a competitive auction
- The weight of fiduciary duty when advising a client

---

# 3. TARGET AUDIENCE ANALYSIS

## 3.1 Primary Audiences

### M&A Lawyers (Associates & Partners)
- **What they want:** Recognition of the legal nuances they deal with daily; a game that doesn't trivialize their work
- **Pain point with existing games:** Business games ignore legal structure entirely
- **Our hook:** Negotiate actual deal terms — MAC definitions, indemnity caps, sandbagging clauses, survival periods
- **Use case:** Law firm retreats, associate training, lateral hire team-building

### Investment Bankers (Analysts through MDs)
- **What they want:** Financial modeling decisions that matter; competitive dynamics of live auctions
- **Pain point with existing games:** Financial games are either too simple or pure spreadsheet exercises
- **Our hook:** Run real valuation analyses, structure financing, manage competitive auction dynamics
- **Use case:** Training programs, desk team bonding, client entertainment

### Private Equity Professionals
- **What they want:** The full LBO experience — sourcing, diligence, structuring, operating, exiting
- **Pain point with existing games:** No game captures the sponsor perspective realistically
- **Our hook:** Build a portfolio across multiple deals, manage fund economics (carried interest, management fees, hurdle rates)
- **Use case:** Fund offsites, LP meetings (as icebreakers), junior training

### Corporate Development / In-House Counsel
- **What they want:** Strategic acquisition decision-making from the corporate perspective
- **Pain point with existing games:** Always cast as "the advisor" never "the principal"
- **Our hook:** Play as the acquirer's board, balancing strategic fit vs. price vs. integration risk
- **Use case:** Corporate strategy offsites, in-house legal team training

## 3.2 Secondary Audiences

### MBA / JD Students
- Experiential learning supplement for M&A coursework
- Professors can use specific scenarios to illustrate concepts

### Regulators / Government Attorneys
- Understand deal dynamics from the other side
- Practice merger review decision-making

### Financial Advisors / Wealth Managers
- Understand M&A events that affect client portfolios
- Continuing education context

## 3.3 Audience-Specific Complexity Toggles

The game includes complexity modules that can be activated or deactivated:

| Module | Beginner | Intermediate | Expert |
|--------|----------|--------------|--------|
| Tax structuring | Off | Basic (asset vs. stock) | Full (368 reorgs, 338 elections, GILTI) |
| Regulatory | Simplified approval | HSR + basic antitrust | Multi-jurisdictional + CFIUS + sector-specific |
| Legal documentation | Pre-set terms | Negotiate key terms | Full term-by-term negotiation |
| Financial modeling | Given valuations | Build from templates | Build from raw financials |
| Post-closing disputes | Off | Basic earn-out disputes | Full indemnity claims + litigation |

---

# 4. GAME OVERVIEW

## 4.1 The Deal Lifecycle

A single game of Deal Room follows one complete M&A transaction through seven phases:

```
PHASE 1          PHASE 2           PHASE 3          PHASE 4
Origination  --> Preliminary   --> Due           --> Deal
& Screening      Engagement       Diligence        Structuring
(15 min)         (20 min)         (25 min)         (20 min)

PHASE 5          PHASE 6           PHASE 7
Definitive   --> Regulatory    --> Closing &
Agreement        Review           Integration
(25 min)         (15 min)         (20 min)
```

Total estimated time: ~2.5 hours for a standard game

## 4.2 The Market

Each game takes place in a specific **Market Environment** that affects all deals:

- **Bull Market** — High valuations, easy financing, aggressive competition
- **Bear Market** — Depressed valuations, tight credit, distressed opportunities
- **Volatile Market** — Unpredictable swings, event-driven disruptions
- **Regulatory Tightening** — Increased antitrust scrutiny, longer review timelines
- **Sector Rotation** — Certain industries hot, others cold

The Market Environment is set at the beginning of the game (randomly or by choice) and can shift during play through Event Cards.

## 4.3 The Companies

The game features a deck of **Target Company Cards** and **Acquirer Company Cards**, each representing a fictional company with:

**Target Company Card — Front:**
- Company name, sector, and brief description
- Revenue, EBITDA, net income (3-year history)
- Debt profile (senior, subordinated, total leverage)
- Key assets & IP portfolio
- Employee count & key management
- Known risks (disclosed)

**Target Company Card — Back (Hidden until Due Diligence):**
- Undisclosed risks (litigation, environmental, regulatory)
- Customer concentration data
- Related-party transactions
- Off-balance-sheet items
- Key contract change-of-control provisions
- Intellectual property vulnerabilities

## 4.4 The Currency

The game uses three currencies:

1. **Capital ($)** — Cash available for acquisitions, fees, and expenses
2. **Influence Points (IP)** — Spent on regulatory lobbying, board persuasion, market intelligence
3. **Reputation (Rep)** — Earned/lost through behavior; affects future deal access and partner willingness

---

# 5. ROLE SYSTEM

## 5.1 Core Roles (4-Player Minimum)

### THE BUYER (Acquirer / PE Sponsor)
**Objective:** Acquire the target at the best possible price with maximum protection
**Starting Resources:** Capital pool, leverage capacity, strategic rationale cards
**Unique Abilities:**
- Can initiate hostile bids (but at reputation cost)
- Can walk away from any deal at any time (but loses sunk costs)
- Chooses deal structure and financing mix
- Sets initial bid and negotiates price

**Decision Space:**
- How aggressively to bid in competitive auctions
- How much diligence to conduct (cost vs. risk)
- Whether to accept seller's terms or push for more protection
- Financing structure (more debt = higher returns but more risk)
- Whether to pursue hostile tactics if friendly approach fails

### THE SELLER (Target Board / Sell-Side Advisor)
**Objective:** Maximize value for target shareholders while fulfilling fiduciary duties
**Starting Resources:** Company card, shareholder base profile, defense mechanism cards
**Unique Abilities:**
- Can run an auction or negotiate exclusively with one bidder
- Can deploy defense mechanisms (poison pills, white knight solicitation)
- Controls information flow in due diligence (what to disclose and when)
- Can invoke Revlon duties to justify/constrain actions

**Decision Space:**
- Whether to engage with unsolicited bidders
- How broad to make the auction (more bidders = higher price but more complexity/risk)
- What to reveal in due diligence and when
- Whether to grant exclusivity and on what terms
- When to invoke fiduciary duty arguments to justify decisions
- Whether to recommend the deal to shareholders

### THE BANKER (Financial Advisor)
**Objective:** Close the deal and maximize advisory fees while maintaining reputation
**Starting Resources:** Relationship network, market intelligence tokens, fairness opinion template
**Unique Abilities:**
- Provides valuations and fairness opinions (can shade them within a range)
- Has market intelligence — can peek at one hidden card per phase
- Can introduce competing bidders to drive up price
- Earns fees only if the deal closes (creates closing incentive)

**Decision Space:**
- How aggressive to make the valuation range (wider = more defensible but less useful to client)
- Whether to encourage or discourage the deal (fee incentive vs. reputation)
- How hard to push for deal certainty vs. maximizing price
- Whether to share market intelligence with client or hold it back
- Whether to bring in competing bidders (helps client but complicates deal)

### THE REGULATOR (DOJ / FTC / Competition Authority)
**Objective:** Protect competition and consumers; prevent anti-competitive mergers
**Starting Resources:** Market analysis tools, investigation budget, enforcement precedent cards
**Unique Abilities:**
- Can issue Second Requests (delays deal, costs both sides money)
- Can challenge the merger in court (dice-based litigation outcome)
- Can accept remedy proposals (divestitures, behavioral commitments)
- Sets the enforcement tone for the market environment

**Decision Space:**
- Whether to clear the deal or investigate further
- What remedy proposals to accept
- Whether to challenge in court (resource-intensive but sets precedent)
- How to balance consumer protection vs. innovation/efficiency arguments
- Whether to coordinate with international regulators (if cross-border module active)

## 5.2 Expansion Roles (5-8 Players)

### THE ACTIVIST INVESTOR
**Objective:** Maximize personal portfolio returns through agitation
**Starting Resources:** Stock position in target, public platform (press cards), proxy fight budget
**Unique Abilities:**
- Can publicly campaign for or against the deal
- Can launch proxy fights to replace board members
- Can demand higher price or structural changes
- Can buy/sell stock positions during the game (affects leverage)

### THE LENDER (Debt Provider)
**Objective:** Earn interest income while protecting against default
**Starting Resources:** Capital pool (larger than Buyer's), credit analysis tools, covenant templates
**Unique Abilities:**
- Sets debt terms: interest rate, covenants, security package
- Can refuse to fund if conditions deteriorate (financing condition risk)
- Can syndicate risk to other players
- Earns steady returns but bears downside risk

### THE TARGET CEO
**Objective:** Balance personal interests (golden parachute, legacy, career) with fiduciary duty to shareholders
**Starting Resources:** Employment agreement details, inside knowledge of target operations, management presentation
**Unique Abilities:**
- Knows all hidden target company information from the start
- Can cooperate with or resist the acquisition
- Can negotiate management rollover / go-private participation
- Can selectively reveal information to influence outcome

**Tension:** Personal incentives may diverge from shareholder interests — this is the game's ethical dilemma engine

### THE OUTSIDE COUNSEL
**Objective:** Provide sound legal advice while managing client relationship and billing
**Starting Resources:** Legal precedent library, associate team (action points), document drafting speed bonuses
**Unique Abilities:**
- Drafts and reviews all game documents at enhanced speed
- Can spot legal risks that other players miss (peek at hidden legal risk cards)
- Provides legal opinions that affect regulatory and litigation outcomes
- Billing clock — earns fees proportional to deal complexity and time spent

## 5.3 Team Play Variant (8-12 Players)

For larger groups, each role can be split into teams:

- **Buy-Side Team:** PE Partner + Associate + Buy-Side Counsel
- **Sell-Side Team:** Board Chair + CEO + Sell-Side Counsel
- **Advisory Team:** Buy-Side Banker + Sell-Side Banker
- **Regulatory Team:** Lead Reviewer + Economist + Staff Attorney

Team members must coordinate but each has individual scoring incentives that may diverge (e.g., the associate wants to impress the partner; the CEO has personal deal economics).

---

# 6. GAME PHASES — DETAILED BREAKDOWN

## PHASE 1: ORIGINATION & SCREENING (15 minutes)

### Setup
1. Market Environment card is drawn and placed face-up
2. Each player receives their Role Card, starting resources, and private objective card
3. 5 Target Company Cards are placed face-up (front side only) in the center — this is the "market"
4. 3 additional Target Company Cards are placed face-down — these are "off-market" opportunities available only through Influence Points

### Buyer Actions
- Review available targets and select 1-3 to pursue (costs Screening Fee per target)
- For each target, choose a Preliminary Valuation Approach:
  - **Comparable Companies Analysis:** Quick, cheap, but imprecise (roll 2 dice to determine valuation range width)
  - **Precedent Transactions:** Moderate cost and time, better precision (roll 3 dice, take best 2)
  - **Discounted Cash Flow:** Expensive and slow, most precise (choose exact midpoint within a defined range)
- Decide whether to make an unsolicited approach or wait for a formal process

### Seller Actions
- Review Buyer interest indicators (the game master or app reveals which targets have Buyer attention)
- Decide whether to:
  - **Run a formal auction:** Announce process, invite all interested Buyers (maximizes price competition but lengthy)
  - **Targeted outreach:** Approach 2-3 specific Buyers quietly (balanced approach)
  - **Exclusive negotiation:** Engage one Buyer only (fastest but may leave value on the table, potential Revlon duty issues)
  - **"Not for sale" posture:** Reject all approaches (risks hostile bid, but may extract higher premium later)

### Banker Actions
- Receive Market Intelligence tokens (peek at hidden information)
- Choose which Buyers to advise (if sell-side) or which targets to recommend (if buy-side)
- Prepare preliminary valuation range (sets the anchor for negotiations)

### Regulator Actions
- Review Market Environment and set enforcement posture:
  - **Permissive:** Deals clear faster, lower investigation budget
  - **Moderate:** Standard review timelines
  - **Aggressive:** More scrutiny, larger investigation budget, precedent-setting appetite
- Publish enforcement priorities (which sectors/deal types will face heightened review)

### Phase 1 Outputs
- Buyer(s) have selected target(s) to pursue
- Seller has chosen a process type
- Market intelligence has been partially distributed
- Regulatory tone is set

---

## PHASE 2: PRELIMINARY ENGAGEMENT (20 minutes)

### 2.1 Initial Approach
If the Buyer is making an unsolicited approach:
- Buyer submits a **Preliminary Indication of Interest (IOI)** card face-down
- IOI contains: proposed price range (high/low), proposed structure (cash/stock/mix), key conditions, timeline
- Seller reviews and decides: Engage, Reject, or Counter

If the Seller is running a process:
- Seller distributes **Confidential Information Memorandum (CIM)** cards to interested Buyers
- CIM reveals additional target information (but not the hidden back-of-card risks)
- Buyers have a timed period to submit IOIs

### 2.2 Letter of Intent Negotiation
Once parties are engaged, they negotiate an LOI. Key terms on the LOI Negotiation Board:

| Term | Buyer Preference | Seller Preference | Negotiation Range |
|------|-----------------|-------------------|-------------------|
| Price | Lower | Higher | Set by valuation range |
| Structure | Stock (tax-deferred) | Cash (certainty) | Cash / Stock / Mixed |
| Exclusivity | Yes, long period | No, or short period | 0-90 days |
| Break-up Fee | High (deters competing bids) | Low or none | 0-5% of deal value |
| No-Shop Clause | Strict | Loose (with fiduciary out) | Strict / Modified / Go-Shop |
| Conditions | Many | Few | Negotiated list |
| Deposit | Small or none | Large (shows commitment) | 0-10% of deal value |

**Mechanic:** Players place bid tokens on a negotiation track for each term. Terms are resolved through a combination of:
- **Blind bidding:** Each side places a token indicating their position
- **Alternating concessions:** If positions are far apart, sides take turns moving toward center
- **Package dealing:** "I'll give you exclusivity if you drop the break-up fee"
- **Walk-away threat:** Either side can walk, but it costs reputation and sunk costs

### 2.3 Competing Bids
If the Seller is running an auction:
- Multiple Buyers submit IOIs simultaneously (face-down)
- Seller reviews all bids and can:
  - Select one Buyer for exclusivity
  - Advance multiple Buyers to due diligence (parallel track)
  - Reject all and re-open the process
- The Activist (if in play) can publicly demand that the board run a fuller process

### 2.4 Hostile Bid Option
If the Seller rejects the approach, the Buyer can:
- Walk away (no cost beyond sunk fees)
- Increase offer and try again (costs Capital)
- Go hostile: Launch a **tender offer** directly to shareholders, bypassing the board
  - Triggers defense mechanism cards for the Seller
  - Reputation cost for the Buyer
  - Regulator pays closer attention to hostile deals

### Phase 2 Outputs
- Signed LOI (or deal termination)
- Key preliminary terms established
- Exclusivity period (if any) begins ticking
- Competing bidder dynamics established

---

## PHASE 3: DUE DILIGENCE (25 minutes)

This is the most strategically rich phase. Players are operating with incomplete information, spending limited resources to uncover hidden risks.

### 3.1 The Data Room

The **Data Room** is a set of face-down cards organized into categories:

```
DATA ROOM LAYOUT:

FINANCIAL          LEGAL             OPERATIONAL        COMMERCIAL
[Card][Card]      [Card][Card]      [Card][Card]       [Card][Card]
[Card][Card]      [Card][Card]      [Card][Card]       [Card][Card]
[Card]            [Card]            [Card]             [Card]

HR/LABOR          TAX               ENVIRONMENTAL      IP/TECHNOLOGY
[Card][Card]      [Card][Card]      [Card][Card]       [Card][Card]
[Card]            [Card]            [Card]             [Card]
```

Each category contains 2-4 cards. Cards are either:
- **Green (Clean):** No material issues found. Adds confidence to the deal.
- **Yellow (Flag):** Minor issue that can be managed through deal terms (price adjustment, specific indemnity, escrow)
- **Red (Critical):** Major issue that could kill the deal or require significant price reduction
- **Black (Deal Breaker):** Catastrophic issue (fraud, massive undisclosed liability, regulatory bar to deal)

### 3.2 Diligence Resource Allocation

The Buyer has a **Diligence Budget** (measured in Diligence Points, or DP). Standard allocation: 12 DP.

Costs to investigate each category:
- **Surface Review (1 DP):** Reveal top card only. Quick but may miss buried issues.
- **Standard Review (2 DP):** Reveal top 2 cards. Reasonable coverage.
- **Deep Dive (3 DP):** Reveal all cards in the category. Thorough but expensive.
- **Expert Analysis (4 DP):** Reveal all cards AND get a "risk assessment" modifier that helps in negotiations.

**Strategic tension:** You can't deep-dive everything. Where do you focus? What do you accept on faith?

### 3.3 Seller's Disclosure Strategy

The Seller controls information flow:
- **Full Disclosure:** Flip all data room cards face-up voluntarily. Builds trust, speeds process, but reveals all weaknesses. Required for some card categories (known material issues must be disclosed per securities law — failing to disclose is a rules violation that can be called out by other players).
- **Selective Disclosure:** Reveal some categories fully while keeping others restricted. Strategic but may raise suspicion.
- **Drip Feed:** Release information slowly to maintain leverage. Risks Buyer frustration and deal fatigue.
- **Bury the Bodies:** Hide bad information deep in the data room (costs Reputation if discovered). The "critical doc is on page 847 of Exhibit Q" approach.

### 3.4 Diligence Findings & Consequences

After investigation, revealed cards affect the deal:

**Green Cards:**
- No price impact
- Buyer gains confidence (bonus to closing probability)

**Yellow Cards:**
- Price reduction of 2-8% (determined by card)
- Can be addressed through specific indemnities or escrow
- Example: "Pending employment lawsuit — $2M potential exposure. Manageable with specific indemnity."

**Red Cards:**
- Price reduction of 10-25% (determined by card)
- May require significant deal restructuring
- Must be addressed in definitive agreement or Buyer walks
- Example: "Major customer (30% of revenue) has change-of-control termination right. No consent obtained."

**Black Cards:**
- Deal is terminated unless both parties agree to extraordinary measures
- Massive price reduction (30-50%) if deal continues
- Example: "CFO has been fabricating revenue figures. Actual EBITDA is 40% of reported."

### 3.5 Diligence Events

During this phase, Event Cards can be drawn that affect diligence:

- **Leak:** Deal rumors hit the press. Target stock price jumps. Buyer's cost increases.
- **Key Employee Departure:** Target's CTO quits during process. Operational risk increases.
- **Competitive Intelligence:** A new Buyer enters the auction. Time pressure mounts.
- **Market Shift:** Industry downturn hits. Valuations compressed across the sector.
- **Regulatory Signal:** Regulator publicly comments on sector consolidation. Adds uncertainty.
- **Whistleblower:** Anonymous tip reveals an undisclosed risk. One hidden card is randomly revealed.

### Phase 3 Outputs
- Risk profile of target is (partially) revealed
- Price adjustments calculated
- Deal-specific indemnity requests identified
- Some players may choose to walk (deal termination)
- Information advantage/disadvantage established between players

---

## PHASE 4: DEAL STRUCTURING (20 minutes)

### 4.1 Transaction Structure Selection

The Buyer (with Banker and Counsel input) selects the deal structure:

**Option A: Stock-for-Stock Merger**
- Buyer issues new shares to target shareholders
- Tax-deferred for target shareholders (Section 368 reorganization)
- Buyer takes on all target liabilities (known and unknown)
- Requires Buyer shareholder approval if issuing >20% new shares
- **Game Effect:** Lower upfront capital cost, but higher risk exposure and dilution

**Option B: Cash Tender Offer**
- Direct offer to target shareholders to buy their shares for cash
- Can bypass target board (but board still issues recommendation)
- Requires financing (see Section 4.2)
- Minimum condition: typically 50.1% or 90% of shares
- **Game Effect:** Highest capital cost, but fastest and most certain. Clean break.

**Option C: Cash Merger**
- Board-approved merger paid in cash
- Requires target shareholder vote
- Target shareholders receive cash at closing
- **Game Effect:** Moderate speed, requires board cooperation and shareholder vote

**Option D: Asset Purchase**
- Buy specific assets/businesses rather than the whole company
- Cherry-pick good assets, leave behind bad liabilities
- More complex (individual asset transfer, third-party consents)
- Potential 338(h)(10) tax election
- **Game Effect:** Best liability protection but most complex and time-consuming

**Option E: Reverse Triangular Merger (Expert Mode)**
- Buyer creates a merger sub that merges into target
- Target survives as subsidiary of Buyer
- Preserves target's contracts and permits
- Combines benefits of stock and asset deals
- **Game Effect:** Optimal structure for many deals but requires sophisticated negotiation

### 4.2 Financing Structure (If Cash Component)

If the deal involves cash, the Buyer must arrange financing:

**Financing Stack (Choose allocation totaling deal value):**

| Source | Cost | Risk | Game Effect |
|--------|------|------|-------------|
| Cash on Hand | None | None | Limited supply |
| Revolving Credit | Low interest | Low (short-term) | Quick but temporary |
| Senior Secured Debt | Medium interest | Medium | Requires collateral, covenants |
| Senior Unsecured Debt | Higher interest | Medium-High | More flexible, higher cost |
| Mezzanine / Sub Debt | High interest | High | Fills the gap, expensive |
| High-Yield Bonds | Highest interest | Highest | Large amounts, market-dependent |
| Equity Co-Investment | Dilutive | Low | Brings in partners but shares upside |

**If the Lender role is active:** The Lender player sets specific terms for the debt package — interest rate, covenants (leverage ratio, coverage ratio, capex limits), security package, and most importantly: **financing conditionality** (can the Lender walk if conditions deteriorate?).

**Financing Risk Cards:**
- **"Market Flex":** Lender demands better terms mid-process (higher interest, tighter covenants)
- **"Syndication Failure":** Other banks won't participate. Lender must hold full amount or deal collapses.
- **"MAC in Financing":** Credit market disruption. Debt becomes unavailable or prohibitively expensive.

### 4.3 Tax Structure Decision

Players choose from tax structure cards:

- **Taxable Transaction:** Simple but target shareholders pay capital gains tax. May demand higher price to compensate.
- **Tax-Free Reorganization (368):** Complex requirements but tax-deferred for target shareholders.
- **Section 338(h)(10) Election:** Treat stock deal as asset deal for tax purposes. Benefits Buyer (step-up in basis) but increases Seller's tax burden.
- **Cross-Border Structure (Expert):** International holding companies, treaty benefits, GILTI/BEAT implications.

### 4.4 Consideration Mix

If using mixed consideration:
- Cash / Stock ratio affects risk allocation, tax treatment, and shareholder approval requirements
- **Collar Mechanism:** Protects against stock price fluctuation between signing and closing
  - Fixed collar, floating collar, walk-away collar options
- **CVR (Contingent Value Right):** Promise of additional payment if certain milestones are hit post-closing
  - Bridges valuation gap but creates post-closing disputes

### Phase 4 Outputs
- Transaction structure selected
- Financing committed (subject to conditions)
- Tax structure determined
- Consideration mix agreed
- Framework for definitive agreement established

---

## PHASE 5: DEFINITIVE AGREEMENT NEGOTIATION (25 minutes)

This is the legal heart of the game — where lawyers earn their fees.

### 5.1 The Term Sheet Board

A large board (physical or digital) displays all negotiable terms. Players place markers indicating their positions, then negotiate toward agreement.

### 5.2 Key Negotiation Points

#### A. Representations & Warranties

**Seller's Reps (What the Seller promises is true):**

Each rep is a card with a scope slider:

| Rep Category | Narrow (Seller-Friendly) | Standard | Broad (Buyer-Friendly) |
|-------------|--------------------------|----------|----------------------|
| Financial Statements | "Prepared in accordance with GAAP" | "+ fairly present in all material respects" | "+ no undisclosed liabilities of any kind" |
| Material Contracts | "All material contracts listed on schedule" | "+ no defaults exist" | "+ no defaults, no threatened defaults, no MAE under any contract" |
| Litigation | "No pending litigation" | "+ no threatened litigation" | "+ no circumstances that could give rise to litigation" |
| IP | "Company owns listed IP" | "+ no infringement claims" | "+ no third-party IP needed for business" |
| Compliance | "In compliance with laws in all material respects" | "+ all permits current" | "+ full compliance, all permits, no investigations" |
| Environmental | "No known contamination" | "+ all reports disclosed" | "+ clean Phase II for all properties" |
| Tax | "All returns filed, all taxes paid" | "+ no audits pending" | "+ no positions that could be challenged" |
| Employees | "All employee info accurate" | "+ no labor disputes" | "+ all key employees committed to stay" |

**Negotiation Mechanic:** For each rep category, Buyer and Seller simultaneously reveal their preferred scope. If they match, it's agreed. If not, they negotiate using alternating concessions or package deals.

**Materiality Qualifiers:**
- The Seller wants to qualify reps with "material" or "Material Adverse Effect" qualifiers everywhere
- The Buyer wants to eliminate materiality qualifiers (or at least define them narrowly)
- This is a meta-negotiation that affects the entire rep section

#### B. Material Adverse Effect (MAE/MAC) Definition

This is its own mini-negotiation game within the game — reflecting the outsized importance of MAC clauses in real deals.

**The MAC Clause Builder:**

Base definition: "Any event, occurrence, or condition that has had or would reasonably be expected to have a Material Adverse Effect on the business, financial condition, or results of operations of the Company..."

**Carve-Out Cards (Seller Wants More, Buyer Wants Fewer):**

Each carve-out is a separate negotiation:

1. General economic conditions
2. Industry-wide conditions
3. Changes in law or regulation
4. Changes in GAAP or accounting standards
5. Natural disasters, pandemics, acts of God
6. War, terrorism, hostilities
7. Changes in the Company's stock price (but not underlying cause)
8. Failure to meet projections (but not underlying cause)
9. Effects of announcement of the transaction itself
10. Actions taken at Buyer's request or with Buyer's consent
11. Effects of compliance with the agreement
12. Changes in interest rates or currency exchange rates
13. Disproportionate impact exception (carved out of carve-outs)

**Mechanic:** Each carve-out card is played one at a time. Seller wants to include it (narrows MAC); Buyer wants to exclude it (broadens MAC). They negotiate each one with a cost in negotiation points.

#### C. Indemnification Structure

| Element | Buyer Position | Seller Position | Range |
|---------|---------------|-----------------|-------|
| Cap | High (100% of deal value) | Low (10-20%) | 10-100% |
| Basket (Deductible) | Low ($0-$100K) | High ($1M+) | Varies by deal size |
| Basket Type | Tipping (once exceeded, recover from $0) | True deductible (only amounts above) | Binary choice |
| Survival Period | Long (3-6 years) | Short (12-18 months) | 12-72 months |
| Fundamental Reps Survival | Indefinite or statute of limitations | Same as general reps | Binary choice |
| Escrow | Large (15-20% of deal value) | Small or none (5%) | 0-20% |
| Special Indemnities | For specific diligence findings | Resist | Per-issue negotiation |
| Sandbagging | Pro-sandbagging (Buyer can claim even if knew) | Anti-sandbagging clause | Binary choice |
| Sole Remedy | Resist (preserve other legal claims) | Insist (indemnity is only recourse) | Binary choice |

#### D. Closing Conditions

Players negotiate which conditions must be satisfied before closing:

- **Regulatory Approval:** Always required (HSR at minimum)
- **Third-Party Consents:** How many key consents needed? What if some aren't obtained?
- **No MAC:** Standard, but definition matters (see above)
- **Financing Condition:** Buyer wants it (out if financing falls through). Seller hates it (certainty of close).
- **Minimum Tender Condition:** For tender offers — what % of shares must be tendered?
- **Shareholder Approval:** Required for certain structures
- **Legal Opinions:** What opinions are required at closing?
- **Bring-Down of Reps:** Must reps be true as of closing? At what standard (true in all respects vs. material respects)?

#### E. Deal Protection Mechanisms

| Mechanism | Description | Buyer/Seller | Negotiation |
|-----------|-------------|--------------|-------------|
| No-Shop | Seller can't solicit competing bids | Buyer wants | Strict vs. Modified vs. Go-Shop |
| Matching Rights | Buyer gets chance to match competing bids | Buyer wants | # of rounds, time to match |
| Termination Fee | Seller pays fee if it walks for a better deal | Buyer wants (high %) | 2-4% of deal value |
| Reverse Termination Fee | Buyer pays if it can't close (financing failure, regulatory block) | Seller wants (high %) | 3-6% of deal value |
| Force the Vote | Seller must put deal to shareholder vote even if board changes recommendation | Buyer wants | Binary |
| Fiduciary Out | Board can change recommendation if required by fiduciary duty | Seller needs | Scope of what triggers it |
| Specific Performance | Can force the other side to close (not just pay damages) | Both may want | Mutual or one-sided |

### 5.3 The Signing

Once all terms are agreed, both sides "sign" the definitive agreement by placing their role tokens on the completed Term Sheet Board. The deal is now signed but not yet closed — the gap between signing and closing creates the next phase of risk.

### Phase 5 Outputs
- Fully negotiated definitive agreement
- All deal terms memorialized
- Signing "ceremony" (tokens placed)
- Closing conditions checklist created

---

## PHASE 6: REGULATORY REVIEW (15 minutes)

### 6.1 HSR Filing

If the deal meets size thresholds (it usually will in the game), the parties must file under the Hart-Scott-Rodino Act.

**Initial Review (30-day waiting period in game: represented by 3 action rounds):**

The Regulator draws a **Review Intensity Card:**
- **Quick Clear (30%):** No issues. Deal clears after waiting period.
- **Information Request (40%):** Regulator asks questions. Parties must spend resources to respond. Adds 2 action rounds.
- **Second Request (25%):** Major investigation. Equivalent to a subpoena. Costs both sides significant Capital and adds 4 action rounds.
- **Block/Challenge (5%):** Regulator moves to block the deal. Litigation phase triggered.

### 6.2 Antitrust Analysis

The Regulator evaluates the merger using actual antitrust frameworks:

**Market Definition:**
- How broadly or narrowly to define the relevant market
- Narrow market = higher market share = more likely to challenge
- Broad market = lower market share = easier clearance

**HHI Calculation (Simplified):**
- Each Target and Acquirer card has market position tokens
- Post-merger HHI is calculated
- HHI > 2500 with change > 200 = presumptively anti-competitive

**Competitive Effects:**
- Unilateral effects (will the merged firm raise prices alone?)
- Coordinated effects (will the merger make tacit collusion easier?)
- Vertical concerns (if vertical merger — input foreclosure, raising rivals' costs)

### 6.3 Remedy Negotiations

If the Regulator has concerns but isn't blocking:
- **Structural Remedy (Divestiture):** Sell off overlapping business units. Effective but costly.
- **Behavioral Remedy:** Promises about future conduct (e.g., maintain open access, firewall). Cheaper but harder to enforce.
- **Consent Decree:** Formal agreement with conditions. Standard middle ground.
- **Fix-It-First:** Complete the divestiture before closing the main deal.

**Mechanic:** The Regulator presents concerns. The parties propose remedies. The Regulator accepts, rejects, or counters. If no agreement, the deal can be:
- Litigated (risky dice roll with precedent card modifiers)
- Abandoned (Buyer walks, reverse termination fee may apply)
- Restructured (change deal to avoid concerns, but costly and time-consuming)

### 6.4 CFIUS Review (Cross-Border Module)

If the target has U.S. operations and the Buyer is foreign:
- Mandatory CFIUS filing for certain sectors (critical technology, critical infrastructure, sensitive personal data)
- Voluntary filing advisable for others
- CFIUS can: Clear, impose mitigation conditions, or recommend Presidential block
- **National Security Risk Cards:** classified technology exposure, proximity to military installations, data sensitivity

### 6.5 International Regulatory (Expert Module)

For cross-border deals:
- EU Commission review (Phase I / Phase II)
- UK CMA review (may differ from EU post-Brexit)
- China SAMR review (geopolitical considerations)
- Each jurisdiction is an independent review with its own timeline and standards
- **Risk:** Approved in one jurisdiction, blocked in another. Now what?

### Phase 6 Outputs
- Regulatory clearance (with or without conditions)
- OR regulatory challenge (litigation sub-game)
- OR deal termination (regulatory block)
- Remedy commitments (if any)

---

## PHASE 7: CLOSING & POST-MERGER INTEGRATION (20 minutes)

### 7.1 Pre-Closing

Between signing and closing, things can go wrong:

**Interim Period Events (Draw 1-3 cards):**
- **Target Business Deterioration:** Revenue drops, key customer lost. Does it trigger the MAC?
- **Buyer's Remorse:** Market conditions change. Buyer looks for exit. Can they invoke MAC?
- **Competing Bid (Topping Bid):** A new Buyer offers more. Does the no-shop allow engagement? Is this a "Superior Proposal"?
- **Shareholder Revolt:** Target shareholders threaten to vote against the deal. Appraisal arbitrage threat.
- **Financing Failure:** Lender backs out. Is there a financing condition? Specific performance?
- **Employee Exodus:** Key talent leaves during the interim period.

**MAC Invocation Sub-Game:**
If the Buyer tries to invoke the MAC clause:
1. The specific MAC definition negotiated in Phase 5 is examined
2. The triggering event is compared against each carve-out
3. Quantitative thresholds are checked
4. If disputed, a "litigation outcome" is determined by drawing Precedent Cards and applying modifiers based on the strength of each side's position
5. Outcomes: Buyer forced to close, Buyer permitted to walk, Negotiated resolution (price cut)

### 7.2 Closing Mechanics

All closing conditions must be satisfied or waived:
- Regulatory approval: Check
- Bring-down certificate: Seller confirms reps still true
- Officer certificates: Delivered
- Legal opinions: Delivered
- Third-party consents: Obtained (or waived)
- Financing: Funded

**Closing Checklist Board:** A visual tracker showing each condition with green (satisfied), yellow (pending), or red (failed) status.

If all conditions are green: **DEAL CLOSES.** Funds transfer. Ownership changes. Everyone settles up.

### 7.3 Post-Closing Integration (Scoring Phase)

After closing, the true value of the deal is determined through integration:

**Integration Challenge Cards (Draw 3):**

| Category | Example | Impact |
|----------|---------|--------|
| Culture Clash | "Target employees resist new corporate policies. 20% attrition in first year." | -15% deal value |
| Customer Retention | "Key accounts defect to competitor citing 'uncertainty'" | -10% deal value |
| Synergy Realization | "Projected $50M cost synergies only 60% achievable" | -8% deal value |
| Systems Integration | "IT systems incompatible. $30M additional investment needed." | -5% deal value |
| Regulatory Compliance | "Post-closing audit reveals additional compliance requirements" | -5% deal value |
| Hidden Liability Emerges | "Pre-closing environmental contamination discovered. Not covered by indemnity." | -20% deal value |
| **Positive:** Synergy Upside | "Revenue synergies exceed projections. Cross-selling opportunity captured." | +10% deal value |
| **Positive:** Talent Acquisition | "Target's engineering team delivers breakthrough product" | +15% deal value |
| **Positive:** Market Timing | "Deal closed at market bottom. Sector recovery boosts value." | +12% deal value |

### 7.4 Post-Closing Disputes

Based on integration outcomes and deal terms:

**Earn-Out Disputes (if earn-out in deal):**
- Did the Buyer operate the business to maximize earn-out metrics?
- Accounting methodology disputes
- "Commercially reasonable efforts" interpretation
- Resolution: Negotiation, then "arbitration" (card draw with modifiers)

**Working Capital Adjustment:**
- Target working capital at closing vs. agreed peg
- Dispute over what's included/excluded
- True-up payment calculation
- Resolution: "Expert determination" mechanic

**Indemnification Claims:**
- If Hidden Liability card is drawn AND it falls within the rep & warranty scope
- Check: Is the claim within the survival period? Above the basket? Below the cap?
- The deal terms negotiated in Phase 5 now directly determine financial outcomes
- This is the payoff for careful legal negotiation

**R&W Insurance (Optional Module):**
- If Buyer purchased rep & warranty insurance during Phase 5
- Insurance covers indemnity claims (with its own retention/deductible)
- Premium was paid at signing
- Claim process: submit claim, insurer reviews, coverage determination

### Phase 7 Outputs
- Final deal value determined (base price +/- adjustments)
- Integration score calculated
- Post-closing dispute outcomes resolved
- Final scores tabulated

---

# 7. CARD SYSTEMS

## 7.1 Card Types Overview

The game uses approximately 300 cards across the following categories:

### Target Company Cards (30 cards)
Each represents a fictional company across 10 sectors:
- Technology, Healthcare/Pharma, Financial Services, Energy, Consumer/Retail
- Industrials/Manufacturing, Media/Telecom, Real Estate, Defense/Aerospace, Professional Services

Each card has:
- Front: Public information (financials, basic business description, known risks)
- Back: Hidden information (undisclosed risks, key contract details, true competitive position)

### Data Room Cards (120 cards)
Organized by diligence category (Financial, Legal, Operational, Commercial, HR/Labor, Tax, Environmental, IP/Technology)
- Green (Clean): 45 cards
- Yellow (Flag): 40 cards
- Red (Critical): 25 cards
- Black (Deal Breaker): 10 cards

### Event Cards (40 cards)
Market and deal-specific events that can occur during any phase:
- Market Events: 15 cards (crashes, booms, sector shifts, rate changes)
- Deal Events: 15 cards (leaks, competing bids, activist actions, employee departures)
- Regulatory Events: 10 cards (policy changes, enforcement actions, political shifts)

### Precedent Cards (30 cards)
Based on patterns from real-world landmark deals and cases:
- Delaware Court rulings on MAC/MAE (inspired by IBP v. Tyson, Akorn v. Fresenius)
- Antitrust outcomes (inspired by AT&T/Time Warner, Sprint/T-Mobile)
- Hostile takeover precedents (inspired by various real situations)
- Each card provides a modifier to dispute resolution outcomes

### Defense Mechanism Cards (15 cards)
Available to the Seller when facing a hostile bid:
- Poison Pill (Shareholder Rights Plan)
- White Knight solicitation
- Crown Jewel defense (sell key assets to make target less attractive)
- Pac-Man defense (target makes counter-bid for acquirer)
- Staggered Board (delays proxy fight)
- Golden Parachutes (increases cost of replacing management)
- Litigation (sue the Buyer for securities violations)
- Greenmail (buy back Buyer's shares at premium)
- Supermajority provision
- Just Say No defense

### Private Objective Cards (20 cards)
Each player receives one secret objective that provides bonus points:
- "Maximize closing speed" (bonus for closing quickly)
- "Protect minority shareholders" (bonus if deal premium exceeds 30%)
- "Build the empire" (bonus for largest deal value)
- "Regulatory hawk" (bonus for extracting maximum remedies)
- "Reputation builder" (bonus for highest reputation at game end)
- "Fee machine" (Banker: bonus for highest total fees earned)
- "Activist returns" (Activist: bonus for highest portfolio return)

### Market Intelligence Cards (15 cards)
Available to players who spend Influence Points:
- Peek at one hidden data room card
- Learn one private objective of another player
- Advance knowledge of upcoming Event Cards
- Information about competing bidder's limits

## 7.2 Card Design Principles

- **Every card references real concepts:** No made-up mechanics. Every risk, every defense, every regulatory action maps to something that happens in real M&A.
- **Flavor text from practice:** Each card includes a brief note explaining the real-world context.
  - Example: A Red Data Room card might say: *"Material customer concentration — top 3 customers = 65% of revenue. cf. Target had 12-month auto-renewal contracts with 30-day termination for convenience."*
- **Scaling:** Card effects scale proportionally to deal size, so the same cards work for different valuations.

---

# 8. FINANCIAL ENGINE

## 8.1 Valuation Framework

The game includes a simplified but realistic valuation system:

### Comparable Companies Analysis
1. Each target has a **sector** and **sub-sector**
2. The game provides a set of **trading comps** (pre-set multiples for each sector)
3. Players select the most relevant comparables (judgment call — this is the skill)
4. Apply EV/EBITDA, P/E, and EV/Revenue multiples
5. Result: Implied valuation range

**Game Mechanic:** A sector-specific Comps Card shows 5-7 comparable companies with their multiples. Player selects 3-4 as "most comparable" — different selections yield different valuation ranges.

### Precedent Transactions Analysis
1. A separate set of **deal comps** shows historical M&A transactions in the sector
2. These include control premiums (20-40% over market)
3. Players assess which precedents are most relevant
4. Result: Implied transaction value range (typically higher than trading comps)

### DCF Analysis
1. The target card provides 3 years of historical financials
2. Players make projection assumptions (growth rate, margin trajectory, capex)
3. A simplified DCF template calculates enterprise value
4. Key inputs: revenue growth rate, EBITDA margin, WACC, terminal growth rate, terminal multiple
5. Result: Intrinsic value estimate

### Valuation Synthesis
Players must present a **valuation summary** combining all three methods:
- Football field chart (range from each method)
- Recommended offer range
- Premium analysis (vs. current trading price, 30-day VWAP, 52-week high)

## 8.2 Accretion/Dilution Analysis

For stock-for-stock deals, the game calculates:
- Pro forma EPS impact
- Is the deal accretive or dilutive to the Buyer's earnings?
- By how much and when does the crossover occur?
- This affects Buyer shareholder approval dynamics

## 8.3 LBO Model (PE Sponsor Variant)

When the Buyer is a PE sponsor:
1. Entry multiple (from valuation)
2. Leverage (from financing structure)
3. Operating improvements (cost reduction cards, revenue enhancement cards)
4. Hold period (choose 3, 5, or 7 years)
5. Exit multiple (uncertain — draw an Exit Environment card at game end)
6. Calculate: Equity IRR and MOIC (multiple on invested capital)

**PE Scoring:** The sponsor is judged on IRR and MOIC, not just deal completion.

## 8.4 Synergy Analysis

Both Buyer and Seller can claim synergies to justify the deal price:

**Cost Synergies (More Certain):**
- Headcount reduction: $X per employee eliminated
- Facility consolidation: $Y per facility closed
- Procurement savings: Z% of combined spend
- System consolidation: one-time cost + ongoing savings

**Revenue Synergies (Less Certain):**
- Cross-selling opportunities
- Geographic expansion
- Product bundling
- Technology leverage

**Game Mechanic:** Synergy claims are placed on a **Synergy Board** with confidence levels. During integration (Phase 7), actual realization is compared to projections. Overestimated synergies reduce the deal's final score.

---

# 9. LEGAL MECHANICS ENGINE

## 9.1 Fiduciary Duty Framework

The game enforces fiduciary duties for the Seller's board:

### Business Judgment Rule
- Presumption that board acts in good faith on an informed basis
- Can be rebutted if: self-dealing, lack of independence, gross negligence, failure to be informed

### Revlon Duties
- Triggered when: the board decides to sell the company, initiates an active bidding process, or approves a break-up transaction
- Requires: reasonable efforts to obtain the best price reasonably available
- **Game Effect:** Once Revlon is triggered, the Seller can be penalized (reputation and score) for accepting a lower bid or for insufficient market check

### Unocal Standard (Hostile Bid Defense)
- Does the board have reasonable grounds to believe a threat to corporate policy exists?
- Is the defensive measure proportional to the threat?
- **Game Effect:** Limits the Seller's use of defense mechanisms. Other players can challenge excessive defenses.

### Entire Fairness (Conflict Transactions)
- If the deal involves conflicts of interest (management buyout, controlling shareholder squeeze-out)
- Both fair process AND fair price must be demonstrated
- Special committee and independent financial advisor required
- **Game Effect:** Additional procedural requirements that cost time and resources

## 9.2 Securities Law Mechanics

### Disclosure Requirements
- Material information must be disclosed (10-K, proxy statement, Schedule 14A)
- Failure to disclose = legal risk card that can be played against the violator
- Insider trading prohibition: players with non-public information cannot trade the target's stock (Activist, if in play)

### Tender Offer Rules
- Williams Act compliance: timing, disclosure, withdrawal rights
- Best price rule: all shareholders get the same price
- Minimum offer period: must remain open for 20 business days (2 game rounds)
- Anti-fraud provisions: no deceptive practices in tender offer

### Appraisal Rights
- Dissenting shareholders can seek judicial determination of fair value
- **Appraisal Arbitrage Mechanic:** If deal premium is low, an "appraisal risk" modifier increases — meaning more shareholders may seek appraisal, tying up deal proceeds in litigation
- Court determination uses own valuation (may be higher or lower than deal price)

## 9.3 Contract Law Mechanics

### The Definitive Agreement as a Living Document
- The deal agreement negotiated in Phase 5 is the literal rulebook for Phases 6-7
- Every term negotiated has mechanical consequences:
  - Broad MAC definition → easier for Buyer to walk → more deal uncertainty
  - High indemnity cap → more Buyer protection → more Seller risk post-closing
  - Long survival period → longer window for Buyer to discover and claim on issues
  - Pro-sandbagging → Buyer can claim even if they knew about the issue during diligence

### Specific Performance vs. Damages
- If one side tries to walk, the other can demand specific performance (force closing) or seek damages (termination fee)
- The remedy available depends on what was negotiated in Phase 5
- **Game Effect:** Players who negotiated for specific performance have more leverage in Phase 7

---

# 10. NEGOTIATION SYSTEM

## 10.1 Negotiation Mechanics

The game uses three negotiation formats:

### Sealed Bid (Used in: IOI submission, Competitive Auctions)
- Players simultaneously submit bids in sealed envelopes (or digital equivalent)
- Highest bidder wins (for auctions) or becomes the lead negotiator
- Information asymmetry: you don't know what others bid

### Alternating Offer (Used in: LOI negotiation, Term Sheet negotiation)
- Players take turns making offers on specific terms
- Each offer must improve on the previous one
- After 3 rounds without agreement, the term defaults to the "standard market" position
- Package dealing allowed: "I'll concede on X if you concede on Y"

### Timed Free Negotiation (Used in: Definitive Agreement, Remedy discussions)
- 5-minute timed rounds of free-form negotiation
- Players can discuss, persuade, threaten, and package-deal
- At the end of the timer, remaining open terms are resolved by die roll (disadvantageous to both sides, creating incentive to agree)

## 10.2 Negotiation Currency

Players have **Negotiation Points (NP)** that represent leverage and stamina:
- Starting NP depends on role and position strength
- NP is spent to:
  - Hold firm on a position (costs 1 NP per round of resistance)
  - Force an issue (spend 3 NP to make a "final offer" that the other side must accept or walk)
  - Recall a concession (spend 5 NP to take back a previous concession — expensive and reputation-damaging)
- NP is earned by:
  - Making creative proposals that resolve impasses
  - Having strong BATNA (Best Alternative to Negotiated Agreement)
  - Market intelligence that strengthens your position

## 10.3 BATNA System

Each player has a hidden **Walk-Away Card** that defines their BATNA:
- Buyer: alternative acquisition target and its attractiveness
- Seller: continue operating independently and projected value
- Banker: other mandates available and their fee potential
- Regulator: precedent value of litigation vs. settlement

The stronger your BATNA, the more NP you earn, and the more credible your walk-away threats. But revealing your BATNA (to prove your threat is credible) also gives information to the other side.

---

# 11. SCORING & VICTORY CONDITIONS

## 11.1 Role-Specific Scoring

### Buyer Score
| Component | Points | Description |
|-----------|--------|-------------|
| Deal Value Created | 0-40 | (Fair value - price paid) + synergies realized - integration costs |
| Deal Protection | 0-15 | Strength of reps, warranties, indemnities secured |
| Financing Efficiency | 0-10 | Cost of capital minimized, structure optimized |
| Speed | 0-10 | Faster closing = more points |
| Reputation | -10 to +10 | Behavior during negotiations |
| Private Objective | 0-15 | Bonus for achieving secret goal |

### Seller Score
| Component | Points | Description |
|-----------|--------|-------------|
| Price Achieved | 0-40 | Premium over fair value |
| Deal Certainty | 0-15 | Minimized conditions and walk-away risk |
| Shareholder Protection | 0-10 | Fiduciary duty fulfilled (market check, best price) |
| Speed | 0-10 | Efficient process |
| Reputation | -10 to +10 | Behavior during negotiations |
| Private Objective | 0-15 | Bonus for achieving secret goal |

### Banker Score
| Component | Points | Description |
|-----------|--------|-------------|
| Fees Earned | 0-30 | Advisory fees (% of deal value, only if deal closes) |
| Client Satisfaction | 0-20 | Client's score as % of maximum possible |
| Fairness Opinion Accuracy | 0-15 | How close was the fairness opinion to actual fair value? |
| Reputation | -10 to +10 | Ethical behavior, reliable advice |
| Private Objective | 0-15 | Bonus for achieving secret goal |
| Deal Tombstone | 0-10 | Bonus for notable/complex deals (builds resume) |

### Regulator Score
| Component | Points | Description |
|-----------|--------|-------------|
| Consumer Protection | 0-30 | Prevented anti-competitive outcomes |
| Enforcement Efficiency | 0-20 | Used investigation budget wisely |
| Precedent Value | 0-15 | Created useful enforcement precedent |
| Market Functioning | 0-10 | Didn't chill beneficial M&A activity unnecessarily |
| Reputation | -10 to +10 | Fair, consistent, well-reasoned decisions |
| Private Objective | 0-15 | Bonus for achieving secret goal |

### Activist Score (if in play)
| Component | Points | Description |
|-----------|--------|-------------|
| Portfolio Return | 0-40 | Profit on stock positions |
| Influence on Deal | 0-20 | Changed the deal outcome (higher price, better terms for shareholders) |
| Public Credibility | 0-15 | Accurate public claims, followed through on threats |
| Reputation | -10 to +10 | Market perception |
| Private Objective | 0-15 | Bonus for achieving secret goal |

## 11.2 Universal Scoring Modifiers

| Modifier | Effect | Trigger |
|----------|--------|---------|
| Ethical Bonus | +5 | Identified and avoided a conflict of interest |
| Innovation Bonus | +5 | Creative deal structure or negotiation approach |
| Dealmaker Bonus | +10 | Closed a deal that seemed impossible |
| Reputation Penalty | -5 per instance | Lied about material facts, broke commitments, acted in bad faith |
| Time Penalty | -2 per round over | Exceeded phase time limits |
| Walkaway Bonus | +5 | Walked away from a bad deal (requires it to be objectively bad) |
| Integration Success | +10 | Post-closing performance exceeds projections |

## 11.3 Campaign Scoring (Multi-Deal Mode)

Over a 5-deal campaign:
- Cumulative score across all deals
- Reputation carries forward (high rep = better deals offered in future rounds)
- Portfolio effects for PE sponsors (diversification, vintage year performance)
- League table ranking (mimicking real-world banking league tables)
- Special awards: "Deal of the Year," "Most Creative Structure," "Best Negotiator," "Worst Integration"

---

# 12. SCENARIO LIBRARY

## 12.1 Core Scenarios (Included in Base Game)

### Scenario 1: "The Friendly Merger"
- **Setup:** Two complementary companies agree to merge. Classic strategic deal.
- **Complexity:** Beginner-Intermediate
- **Focus:** Valuation, deal structure, standard negotiation
- **Inspired by:** Generic strategic merger template
- **Players:** 4 (Buyer, Seller, Banker, Regulator)
- **Special Rules:** None. Clean learning scenario.

### Scenario 2: "The Hostile Takeover"
- **Setup:** Aggressive Buyer makes unsolicited bid for a reluctant Target.
- **Complexity:** Intermediate
- **Focus:** Defense mechanisms, hostile tactics, fiduciary duties, shareholder dynamics
- **Inspired by:** Classic hostile takeover patterns
- **Players:** 5-6 (adds Activist and/or Target CEO)
- **Special Rules:** Defense mechanism cards active. Proxy fight sub-game available.

### Scenario 3: "The Leveraged Buyout"
- **Setup:** PE sponsor pursues take-private of a public company using significant leverage.
- **Complexity:** Intermediate-Advanced
- **Focus:** LBO modeling, financing structure, management rollover, debt markets
- **Inspired by:** Classic LBO patterns
- **Players:** 5-6 (adds Lender role)
- **Special Rules:** LBO model required. Financing risk cards active. Management participation negotiation.

### Scenario 4: "The Competitive Auction"
- **Setup:** Sell-side advisor runs a broad auction for an attractive target. Multiple bidders.
- **Complexity:** Advanced
- **Focus:** Auction dynamics, bid strategy, information management, speed vs. certainty
- **Inspired by:** Broad auction process patterns
- **Players:** 6-8 (multiple Buyers compete)
- **Special Rules:** Multiple simultaneous bidders. Sealed bid mechanics. Auction round structure.

### Scenario 5: "The Cross-Border Deal"
- **Setup:** Foreign Buyer acquires a domestic company with regulatory complications.
- **Complexity:** Advanced
- **Focus:** CFIUS review, multi-jurisdictional regulatory, cultural integration, FX risk
- **Inspired by:** Cross-border regulatory challenge patterns
- **Players:** 5-6 (Regulator has expanded role)
- **Special Rules:** CFIUS module active. International regulatory module active. FX risk cards.

### Scenario 6: "The Distressed Acquisition"
- **Setup:** Target is in financial distress. Buyer sees opportunity but faces unusual risks.
- **Complexity:** Advanced
- **Focus:** Section 363 sale (bankruptcy), credit bidding, stalking horse bids, successor liability
- **Inspired by:** Distressed M&A patterns
- **Players:** 5-6 (Lender has critical role)
- **Special Rules:** Bankruptcy court mechanics. Credit bid option. Expedited timeline. Reduced diligence.

### Scenario 7: "The Management Buyout"
- **Setup:** Target's management team, backed by PE, bids to take the company private.
- **Complexity:** Expert
- **Focus:** Conflicts of interest, entire fairness, special committee, go-shop process
- **Inspired by:** MBO fiduciary duty patterns
- **Players:** 6-8 (Target CEO has conflicting incentives)
- **Special Rules:** Entire fairness standard applies. Special committee required. Heightened fiduciary scrutiny. Go-shop mandatory.

### Scenario 8: "The Broken Deal"
- **Setup:** A signed deal faces challenges between signing and closing. Can it be saved?
- **Complexity:** Expert
- **Focus:** MAC invocation, bring-down conditions, specific performance, termination rights
- **Inspired by:** Deal dispute patterns
- **Players:** 4-6 (starts at Phase 6 — deal is already signed)
- **Special Rules:** Players receive a pre-negotiated deal agreement and must navigate closing challenges using the terms they're given. Focus on contract interpretation and enforcement.

## 12.2 Expansion Scenario Packs

### "Tech Titans" Pack
- SPAC merger with de-SPAC regulatory complications
- Big Tech antitrust battle (platform acquisition under regulatory microscope)
- Acqui-hire (buying a company primarily for its talent)
- IP-driven acquisition with complex licensing issues

### "Healthcare & Pharma" Pack
- Pharma mega-merger with FTC drug overlap issues
- Biotech acquisition with milestone/CVR-heavy structure
- Hospital system merger with state AG review
- Generic drug company roll-up with pricing scrutiny

### "Financial Services" Pack
- Bank merger with OCC/Federal Reserve approval process
- Insurance company acquisition with state insurance commissioner reviews
- Fintech acquisition by traditional bank (regulatory uncertainty)
- Asset management consolidation with fund consent requirements

### "Energy & Infrastructure" Pack
- Oil & gas merger with FERC approval
- Utility acquisition with state PUC rate-setting implications
- Renewable energy portfolio acquisition with tax credit considerations
- Pipeline deal with eminent domain and environmental challenges

### "Special Situations" Pack
- Activist-driven sale process
- Going-private with controlling shareholder (squeeze-out mechanics)
- Dual-class stock complications
- Earnout-heavy deal with post-closing operational disputes
- Reverse merger (private company going public via acquisition)
- Carve-out / spin-off followed by sale

---

# 13. GAME MODES

## 13.1 Standard Game (2.5-3 hours)
- Full 7-phase deal lifecycle
- 4-6 players
- One complete transaction
- Recommended for first-time players (at Intermediate complexity)

## 13.2 Speed Round (60-90 minutes)
- Compressed phases (Phase 1-2 combined, Phase 3-4 combined, Phase 5-7 combined)
- Pre-set deal parameters with fewer negotiation points
- 4 players
- Great for conference sessions and time-limited settings

## 13.3 Deep Dive (4-5 hours)
- Full 7-phase lifecycle with all complexity modules active
- Extended negotiation periods
- 6-8 players with all expansion roles
- Expert complexity level
- Intended for experienced players and professional training

## 13.4 Campaign Mode (5 sessions x 2-3 hours each)
- Play through 5 deals over multiple sessions
- Reputation and resources carry forward
- Market environment evolves between deals
- Final scoring based on cumulative performance and league table ranking
- Includes career progression (associates become partners, analysts become MDs)
- Ideal for: MBA courses, law firm associate training programs, bank analyst programs

## 13.5 Training Module Mode (45-60 minutes)
- Focus on one specific phase or mechanic
- Pre-set everything else, deep-dive on the target topic
- Examples:
  - "MAC Clause Workshop" — Phase 5 only, focused on MAC definition negotiation
  - "Diligence Boot Camp" — Phase 3 only, practice diligence resource allocation
  - "Valuation Challenge" — Phase 1 only, competitive valuation exercise
  - "Regulatory Review" — Phase 6 only, play as Regulator analyzing a pre-set deal
  - "Hostile Defense" — Phase 2 only, Seller deploys defenses against hostile Buyer
- **CLE Credit Potential:** These modules can be structured for continuing legal education

## 13.6 Solo Mode (Digital Only)
- Play as any role against AI opponents
- Progressive difficulty levels
- Scenario-based challenges
- Great for learning the game mechanics
- Practice mode for specific phases

## 13.7 Spectator/Judge Mode
- One player acts as the "Deal Master" (game master)
- Resolves disputes, introduces events, manages the narrative
- Particularly useful for training sessions where a senior partner/MD guides juniors
- The Deal Master can introduce custom events or challenges based on their real-world experience

---

# 14. EDUCATIONAL & CLE INTEGRATION

## 14.1 Learning Objectives Mapping

Each game phase maps to specific professional competencies:

| Phase | Legal Learning Objectives | Finance Learning Objectives |
|-------|--------------------------|----------------------------|
| Phase 1: Origination | Target selection criteria, antitrust red flags | Valuation methodology selection, market analysis |
| Phase 2: Engagement | LOI drafting, exclusivity agreements, fiduciary duties | IOI preparation, bid strategy |
| Phase 3: Due Diligence | Diligence scope, risk assessment, disclosure obligations | Financial diligence, quality of earnings |
| Phase 4: Structuring | Deal structure selection, tax implications | Financial modeling, leverage analysis |
| Phase 5: Definitive Agreement | Rep & warranty negotiation, MAC clauses, indemnification | Fairness opinions, valuation support |
| Phase 6: Regulatory | HSR compliance, antitrust analysis, CFIUS | Regulatory risk assessment, remedy costs |
| Phase 7: Closing/Integration | Post-closing adjustments, dispute resolution | Integration planning, synergy tracking |

## 14.2 CLE Credit Structure

The game can be structured to qualify for Continuing Legal Education credits:

**Proposed CLE Modules:**
1. "M&A Fiduciary Duties in Practice" (2 credits) — Phases 2-3 focus
2. "Negotiating the Definitive Agreement" (3 credits) — Phase 5 focus
3. "Antitrust Review of Mergers" (2 credits) — Phase 6 focus
4. "MAC Clauses: Drafting and Enforcement" (1.5 credits) — Phase 5 + 7 focus
5. "Hostile Takeovers and Defense Mechanisms" (2 credits) — Scenario 2 focus

**Each module includes:**
- Pre-game reading materials (key cases, regulatory guidance)
- In-game learning moments (annotated cards referencing relevant law)
- Post-game discussion guide (what happened, what would happen in real life, key takeaways)
- Written assessment (short quiz for credit verification)

## 14.3 Law Firm Integration

### Associate Training Program
- 8-week program, one game session per week
- Progressive complexity: start with Beginner, end with Expert
- Each week focuses on a different aspect of M&A practice
- Senior associates or partners serve as Deal Masters
- Assessment: performance tracking across sessions, written reflection

### Client Development
- Play with clients as a relationship-building exercise
- Demonstrates firm expertise in an engaging format
- Non-competitive variant where firm lawyers serve as advisors to client teams

### Summer Associate Program
- Engaging introduction to M&A practice
- Team-building across practice groups
- Assessment tool for M&A interest and aptitude

## 14.4 Business School Integration

### MBA M&A Course Supplement
- Replace one or two case discussions with game sessions
- Students experience concepts actively rather than reading about them passively
- Graded on decision quality, not just outcomes (professor as Deal Master)

### Executive Education
- Shortened format for executive programs
- Focus on strategic decision-making aspects
- Real-time market simulation with live events

---

# 15. COMPONENT DESIGN

## 15.1 Physical Components (Board Game Version)

### Board Elements
1. **Main Deal Board** (24" x 36") — Phase tracker, market environment, scoring tracks
2. **Negotiation Board** (18" x 24") — Term-by-term negotiation positions with sliding markers
3. **Data Room Board** (12" x 18") — Grid layout for face-down diligence cards
4. **Closing Checklist Board** (8" x 12") — Condition tracker with status markers

### Cards (300+ total)
- Standard playing card size (2.5" x 3.5")
- Color-coded by type (Target = blue, Data Room = category-coded, Event = red, etc.)
- Premium card stock with linen finish
- Double-sided where needed (Target cards, Data Room cards)

### Tokens & Markers
- Capital tokens (denominated in $10M, $50M, $100M, $500M)
- Influence Point tokens (bronze coins)
- Reputation markers (sliding track markers, one per player)
- Negotiation position markers (colored cubes, one set per player)
- Phase progress tokens
- Timer (sand timer for timed negotiations, 5-minute and 10-minute)

### Player Materials
- Role cards (laminated, with summary of abilities and scoring)
- Private objective cards (sealed envelopes)
- Walk-away cards (sealed envelopes)
- Quick reference sheets (negotiation terms, scoring rules)
- Valuation worksheets (tear-off pad for financial calculations)
- Notepads for strategy and negotiation notes

### Premium Components (Deluxe Edition)
- Metal capital coins instead of cardboard tokens
- Leather-bound role folders
- Wooden negotiation markers
- Custom dice (for litigation/regulatory outcomes)
- Deal tombstone miniatures (awarded for completed deals)
- Briefcase-style game box

## 15.2 Digital Companion App

Even the physical game benefits from a digital companion:

**Features:**
- **Valuation Calculator:** Input assumptions, get DCF/comps/precedent output
- **Timer Management:** Phase timers with alerts
- **Score Tracker:** Real-time scoring based on game state
- **Card Database:** Searchable reference for all cards and their real-world context
- **Hidden Information Manager:** Secure display of private cards (so players don't have to hide physical cards)
- **Event Generator:** Random or curated event card drawing
- **Rules Reference:** Searchable rulebook with examples

---

# 16. DIGITAL PLATFORM ARCHITECTURE

## 16.1 Full Digital Version

### Platform
- **Web Application** (primary) — accessible from any device
- **iOS/Android Apps** — for mobile play
- **Desktop Application** — for serious/competitive play

### Core Features
- Real-time multiplayer (4-8 players)
- AI opponents for solo/mixed play
- Scenario builder for custom games
- Replay system (review past games move-by-move)
- Analytics dashboard (track your performance across games)

### Technology Stack (Recommended)
- **Frontend:** React/Next.js with real-time WebSocket communication
- **Backend:** Node.js/Python with game state management
- **Database:** PostgreSQL for persistent data, Redis for real-time state
- **Real-time:** WebSocket (Socket.io) for live multiplayer
- **AI:** Language model integration for AI opponents and scenario generation
- **Hosting:** Cloud-based (AWS/GCP) with low-latency game servers

### UI/UX Design Principles
- **Professional Aesthetic:** Dark theme with gold/navy accents. Bloomberg terminal meets board game. No cartoonish elements.
- **Information Density:** Professionals can handle complex UIs. Show relevant data, allow drill-down.
- **Responsive:** Must work on tablet (minimum) for in-person use. Desktop for remote play.
- **Accessibility:** High contrast, keyboard navigation, screen reader support.

### Digital-Only Features
- **Dynamic Financials:** Spreadsheet-quality financial models built into the game
- **AI Deal Master:** Automated event generation and dispute resolution
- **Market Simulation:** Live-updating market conditions that affect deal dynamics
- **Replay & Analysis:** Post-game breakdown of every decision and its impact
- **Matchmaking:** Find games by skill level, preferred role, available time
- **Tournaments:** Organized competitions with rankings and prizes
- **Scenario Editor:** Create and share custom scenarios with the community

## 16.2 Hybrid Mode

- Physical board game with digital companion app
- App manages hidden information, scoring, and financial calculations
- Players interact physically but use phones/tablets for private information
- Best of both worlds: physical negotiation energy + digital convenience

---

# 17. MONETIZATION & DISTRIBUTION

## 17.1 Revenue Streams

### Physical Game Sales
- **Standard Edition:** $149 (4-player base game, core scenarios)
- **Deluxe Edition:** $249 (6-player game, premium components, all core scenarios)
- **Expansion Packs:** $39-49 each (additional scenarios, roles, cards)
- **Professional Training Kit:** $499 (12-player team set, facilitator guide, CLE materials)

### Digital Platform
- **Base Game:** $29.99 (includes Standard Edition content)
- **Full Game + Expansions:** $59.99
- **Monthly Subscription:** $9.99/month (access to all content, matchmaking, tournaments)
- **Enterprise License:** Custom pricing for firms (bulk seats, private servers, CLE tracking)

### Professional Services
- **Facilitated Training Sessions:** $5,000-15,000 per session (professional Deal Master, customized scenarios, post-session debrief)
- **Custom Scenario Development:** $2,000-5,000 per scenario (firm-specific scenarios based on their practice areas)
- **CLE Partnership:** Revenue share with CLE accreditation bodies
- **Conference Licensing:** $1,000-3,000 per event (set up and run games at legal/finance conferences)

## 17.2 Distribution Channels

### Direct to Consumer
- Website with e-commerce
- Digital app stores (Apple, Google, Steam)

### Professional Channels
- Law firm training departments
- Investment bank training programs
- Business school bookstores
- Legal/finance conference exhibitor halls
- CLE providers (Practising Law Institute, ALI CLE, etc.)

### Partnerships
- **Law firms:** Co-branded versions for firm retreats and training
- **Business schools:** Course adoption program
- **Bar associations:** CLE accreditation partnerships
- **Conference organizers:** Featured activity at industry events (ABA, AIPLA, ACG conferences)

## 17.3 Marketing Strategy

### Target Professional Communities
- LinkedIn campaigns targeting M&A lawyers, investment bankers, PE professionals
- Sponsored content in legal publications (The American Lawyer, Law360, The Deal)
- Finance publications (Financial Times, Bloomberg, Institutional Investor)
- Speaking slots at M&A conferences

### Influencer Strategy
- Partner with prominent M&A practitioners for endorsements
- Law school professor adoption program (free copies for course use)
- YouTube/podcast appearances on legal and finance channels

### Community Building
- Discord server for players
- Reddit community (r/DealRoom or similar)
- Twitch streams of competitive games
- User-generated scenario contests

---

# 18. DEVELOPMENT ROADMAP

## Phase 1: Foundation (Months 1-4)

### Month 1-2: Core Design
- [ ] Finalize game rules and mechanics
- [ ] Complete card database (all 300+ cards with content, balance, and flavor text)
- [ ] Develop valuation engine (formulas, templates, balance testing)
- [ ] Write complete rulebook (40-60 pages)
- [ ] Create player reference sheets

### Month 3-4: Prototype & Playtest
- [ ] Build paper prototype of physical game
- [ ] Internal playtesting (minimum 20 games)
- [ ] Balance adjustments (card values, scoring weights, timing)
- [ ] Recruit external playtesters from target audience (lawyers, bankers)
- [ ] Incorporate feedback, iterate

## Phase 2: Production & Digital MVP (Months 5-8)

### Month 5-6: Physical Game Production
- [ ] Graphic design for all components (board, cards, tokens)
- [ ] Find manufacturing partner (board game production)
- [ ] Pre-production samples and quality review
- [ ] Production run for initial inventory (1,000 Standard + 500 Deluxe)

### Month 7-8: Digital Platform MVP
- [ ] Build core digital game engine
- [ ] Implement real-time multiplayer
- [ ] Develop AI opponent system (basic)
- [ ] Build companion app for hybrid mode
- [ ] Internal digital playtesting

## Phase 3: Launch (Months 9-10)

### Month 9: Soft Launch
- [ ] Beta release of digital platform to playtest community
- [ ] Physical game available for pre-order
- [ ] Demo sessions at 2-3 target conferences
- [ ] Outreach to law firm training directors and business school professors
- [ ] Press/media outreach

### Month 10: Full Launch
- [ ] Physical game shipping
- [ ] Digital platform public release
- [ ] Launch marketing campaign
- [ ] First facilitated training sessions
- [ ] CLE accreditation applications submitted

## Phase 4: Growth (Months 11-18)

### Month 11-14: Expansion Content
- [ ] First expansion pack (Tech Titans or Healthcare/Pharma)
- [ ] Campaign mode development and release
- [ ] Advanced AI opponents
- [ ] Tournament system implementation
- [ ] Enterprise licensing program launch

### Month 15-18: Scale & Community
- [ ] Additional expansion packs
- [ ] Scenario editor for user-generated content
- [ ] International versions (UK, EU legal frameworks)
- [ ] Professional certification program ("Certified Deal Room Facilitator")
- [ ] Annual championship tournament

## Phase 5: Long-Term Vision (Year 2+)

- [ ] AI-powered dynamic scenarios that respond to player behavior
- [ ] VR version for immersive negotiation experience
- [ ] Integration with legal research platforms (Westlaw, Lexis) for real precedent lookup
- [ ] Partnership with major law firms for branded annual tournaments
- [ ] Academic research program (game theory, negotiation behavior, decision-making under uncertainty)
- [ ] Adaptation for other transaction types (IPOs, restructurings, joint ventures, real estate deals)

---

# APPENDIX A: SAMPLE CARD TEXT

## Target Company Card Example

**FRONT:**
```
NEXAGEN THERAPEUTICS, INC.
Sector: Healthcare / Biotechnology
Sub-sector: Oncology

Revenue (TTM): $2.4B
EBITDA (TTM): $480M (20% margin)
Net Income: $215M
Total Debt: $900M (1.9x leverage)
Enterprise Value (Market): ~$12B

Key Assets:
- 3 FDA-approved oncology drugs
- Phase III pipeline with 2 candidates
- 1,200 employees, HQ: Cambridge, MA

Known Risks:
- Lead drug patent expires in 4 years
- FDA warning letter (resolved) in 2024
- Customer concentration: top 3 PBMs = 55% of revenue
```

**BACK (Hidden):**
```
UNDISCLOSED ITEMS:
[RED] Patent challenge filed by generic manufacturer on lead drug
      (could accelerate patent cliff by 2 years)
[YELLOW] Two senior scientists under non-compete disputes with
         former employer — potential IP contamination
[YELLOW] Pending qui tam action alleging off-label promotion
         ($50-100M potential exposure)
[GREEN] Phase III data stronger than publicly reported
        (potential upside surprise)
[RED] Key distribution agreement has change-of-control
      termination right — no consent obtained
```

## Event Card Example

```
MARKET DISRUPTION
Type: Market Event
Phase: Any (draw when instructed)

"CREDIT MARKETS FREEZE"

A major financial institution's distress triggers a credit
market dislocation. High-yield bond issuance halts.
Leveraged loan markets seize up.

EFFECTS:
- All debt financing costs increase by 200 bps
- Financing Condition risk: roll die. On 1-2, committed
  financing is pulled (Lender may invoke MAC).
- New leveraged deals cannot close for 2 rounds
- Distressed acquisition opportunities increase
  (draw 2 additional Target Company cards)

DURATION: 3 rounds or until "Market Recovery" event drawn

Historical reference: Similar to credit market conditions
in late 2008 and early 2020.
```

## Data Room Card Example

```
CATEGORY: Environmental
SEVERITY: RED (Critical)

"LEGACY CONTAMINATION"

Phase II environmental site assessment reveals significant
soil and groundwater contamination at the Company's
primary manufacturing facility.

Estimated remediation cost: $30-75M
Regulatory status: State EPA aware, no formal order yet
Insurance: Environmental policies lapsed 3 years ago

DEAL IMPACT:
- Price reduction: 8-15% of deal value
- Requires: Environmental indemnity (uncapped) OR
  significant escrow (20% of deal value, 10-year hold)
- Alternative: Buyer walks (no penalty if in diligence phase)

If not discovered during diligence and deal closes:
- Integration card: automatic -15% deal value modifier
- Indemnification claim: only if environmental rep was
  broad enough to cover legacy contamination AND
  within survival period AND above basket
```

---

# APPENDIX B: QUICK-START RULES (2-PAGE SUMMARY)

## Setup (10 minutes)
1. Choose a Scenario Card (start with Scenario 1 for new players)
2. Assign roles (Buyer, Seller, Banker, Regulator minimum)
3. Draw Market Environment card
4. Deal Target Company cards
5. Distribute starting resources per role card
6. Deal Private Objective cards (keep secret)
7. Set up Negotiation Board and Data Room Board
8. Start the timer

## Turn Structure
Each phase has a set time limit. Within each phase:
1. **Action Phase:** Players take actions available to their role
2. **Negotiation Phase:** Relevant players negotiate terms
3. **Event Phase:** Draw Event Card (if applicable)
4. **Resolution Phase:** Resolve outcomes, update boards

## How to Win
- Complete the deal (or successfully walk away from a bad one)
- Maximize your role-specific score
- Achieve your Private Objective
- Maintain high Reputation

## Core Rule: Everything Is Negotiable
If two players disagree on a term, they negotiate. If they can't agree within the time limit, the term defaults to "market standard" (defined on the Negotiation Board) — which is usually worse for both sides than a negotiated outcome.

## Core Rule: Information Is Power
Hidden cards are hidden until revealed through game mechanics (diligence, intelligence, events). Players may NOT lie about factual game state (e.g., "I don't have that card" when you do), but they CAN bluff about preferences and intentions (e.g., "I'll walk if you don't agree" when you won't actually walk).

## Core Rule: Time Kills Deals
Every phase has a time limit. Unused time is lost. Delays cost resources. The deal has momentum — keep it moving or pay the price.

---

*This document is a living design specification. Each section will be expanded with detailed rules, examples, and balance notes as development progresses.*

*Version 1.0 — Initial Comprehensive Design*
