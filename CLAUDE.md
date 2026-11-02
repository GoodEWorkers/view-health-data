# Engineering Conventions

**Language- and project-agnostic.** §1–15 state rules as roles and behaviours; stack
bindings live in **Appendix A**, and adding a language extends the appendix, never the
canon. Anything true of only one tree — paths, entity vocabulary, rule-id schemes,
sign-off roles, which standard governs — is declared by that tree's own instruction
file. The test: does a rule name a location that already exists in one tree, or
prescribe one every tree should create? Only the second belongs here.

**Three passes.** The card is the whole doctrine; the body is consulted on demand;
the appendix opens only for the language you're touching. An instruction file that
exceeds working memory stops being followed — by humans and models alike (§2).

**Why-discipline.** A rule carries its rationale only where it would otherwise be
disobeyed — where it's counterintuitive, costly, or contradicts a plausible
instinct. Obvious rules stand bare.

---

## The card

**Think**

1. Understand first, then climb the ladder: smallest sufficient change, in the
   *right* place. The best code is the code never written.
2. Comprehension is the constraint, not typing. Write for the next reader's
   working memory.
3. State the plan before generating. Can't state a block's plan in one sentence
   without re-reading it? Reject it.
4. Diagnose what's missing before acting: **knowledge** → look it up;
   **information** → fetch the code; **capacity** → write the state down. Same
   three for the model you're prompting.

**Write**

5. Name the role. Leave a beacon. One recognisable pattern per unit.
6. Comment the *why*, never the *what*. 255 characters per block, hook-enforced.
7. Test first; prove the test can fail; mutate the pure modules.
8. Expected errors are values in the published contract. Throw only on a broken
   invariant.

**Ship**

9. Never trust the client, never log the sensitive, pin everything, authorize
   server-side.
10. Rebase not merge; small PRs; draft by default; ask before every commit, push,
    and merge — every time.
11. No AI authorship in git history. Disclose tooling in the PR or tracker.
12. Review the diff, not the chat. Nothing merges unread in the paths that
    matter.

---

## 1. Philosophy

**You are a lazy senior developer. Lazy means efficient, not careless.** Smallest
correct change → least surface to test → smallest diff to review → cheapest next
change. A small diff in the *wrong* place is a second bug, not efficiency.

**Never lazy about:** understanding the problem; validation at trust boundaries;
error handling that prevents data loss; security; accessibility; real-world
calibration (a clock drifts, a sensor reads off); anything explicitly requested.

**The cycle:** Understand → smallest sufficient change → test first → prove the
tests guard → refactor simpler → ship safely → fix root causes → (Understand).

**The Ponytail ladder — stop at the first rung that holds:**

1. Does this need to exist at all? (YAGNI)
2. Does it already exist here? Reuse it.
3. Does the standard library do it?
4. Does a native platform feature cover it?
5. Does an installed dependency solve it?
6. Can it be one line?
7. Only then: the minimum code that works.

No unrequested abstractions, dependencies, or boilerplate. **Deletion over
addition, boring over clever, fewest files possible.** Between two equal-sized
approaches take the **edge-case-correct** one — lazy means less code, not the
flimsier algorithm.

Cheap generation moves the binding constraint entirely to comprehension, review,
and proof. That makes §2 load-bearing, not decorative.

---

## 2. The cognitive budget

Writing is no longer the expensive step. Understanding, reviewing and proving are.

### 2.1 Diagnose before you act

Three failure modes, three remedies. Misdiagnosing costs more than the confusion.

| Missing | Symptom | Remedy | Anti-remedy |
|---|---|---|---|
| **Knowledge** | You don't know what this construct, protocol, or term *means* | Look it up in the authority, then elaborate it into a pattern you'll recognise next time; batch lookups to a phase boundary | Guessing from context; asking a model to invent semantics |
| **Information** | You know the construct, not what *this* code does — opaque name, callee elsewhere | Fetch the code: callee, caller, schema, spec | Reasoning about code you haven't opened |
| **Capacity** | You understand every line and still can't hold the whole | Offload (§2.4) | Re-reading harder; "I'll keep it in my head" |

Name which one you're short of before reaching for a tool. Same diagnostic for the
model you're prompting (§13.2). Re-entering a mental model after an interruption
costs tens of minutes, so write down where you were *before* you break.

### 2.2 Three loads — attack only one

- **Intrinsic**: the problem's inherent difficulty. **You may not reduce it.** Code
  that reads easily because it dropped an edge case is wrong, not simple.
- **Extraneous**: accidental tax — opaque names, delocalised logic, a bespoke
  construct where a known pattern fits, five indirections to reach the one line
  that matters. **The only load a review may demand you cut.**
- **Germane**: building a durable mental model. **Protect it** — it's what
  *why*-comments, design records and named patterns buy. Stripping it to "look
  clean" makes a codebase unlearnable.

Every complexity comment must name which load it targets; "simplify this" without
that is unactionable and often wrong.

### 2.3 Chunks and beacons

A fluent reader perceives recognised patterns whole and traces everything else
line by line. Design for recognition.

- **One recognisable pattern per unit** beats a clever composition of three;
  novelty is a cost paid by every future reader.
- **Name the pattern** so memory can fire: `priorityQueue` is a retrieval cue,
  `arr2` is a tracing assignment. This is why §1 says follow existing patterns.
- **Every non-trivial block carries a beacon** — a fragment confirming structure
  without tracing. *Simple:* a self-explaining name (`root`, `total`).
  *Compound:* co-occurring members that identify a structure together — `left` and
  `right` in one place confirm a binary tree without reading the constructor.
- **Keep compound beacons co-located**: don't scatter identifying members or split
  a state machine across modules.
- **Review heuristic:** after reading a diff, ask *what did I confirm at a glance,
  and what forced me to trace?* The second list is where extraneous load and
  naming failures both live — and the best comment you can leave.
- **Correct-but-unrecognisable is a defect here.** A model will synthesise valid
  constructions nobody on the team can chunk; ask for the familiar pattern.

### 2.4 Offload state to the screen

For any block whose state evolution isn't obvious, build the artifact instead of
re-reading — all three are worth requesting from a model verbatim:

- **State table** — columns are variables, rows are execution steps.
- **Slice** — every line transitively connected to one variable or outcome:
  *"isolate the slice for variable X"*.
- **Focal point + dependency map** — where a behaviour begins, what it reaches.

The artifact lives in the PR, the design record, or a scratch file — **never a
comment.** The 255-character cap (§4.1) exists to keep it out of the source.

### 2.5 Text structure is not plan knowledge

You can read every line (**text**) and not know what it's *for* (**plan**).
Generated code makes that gap wide and easy to miss because it reads fluently.

**The gate, for every block you didn't author:** state the plan in one sentence
without re-reading — the inputs it trusts, the invariant it maintains, what it does
when input is wrong. If you can't, reject it or reduce it until you can. Fluent
prose in the surrounding chat is not evidence you passed (§13.3).

Map its entities onto the domain vocabulary (§3). A module inventing synonyms for
entities the domain already names has drifted from the plan even if it compiles.

---

## 3. Naming

- **English.** **≥ 3 characters** unless very explicitly clear with fewer.
- **No acronyms**, no shortened words (`engineering`, not `eng`) — autocomplete
  makes length free, clarity is not.
- **Descriptive**, **pronounceable**, **searchable**, with **meaningful
  distinctions**: two names must differ in a way that explains the difference.
- **Named constants, never magic numbers.** Enums and status sets are named
  module-level constants, never inline strings; normalise aliases in one map.
- Name the *why it matters* (`canAccessRecord`), never the operators
  (`ageAndConsentAndNotSuspended`).
- **Follow the host language's case convention** consistently (Appendix A).

### 3.1 Name the role

A name stating the variable's *role* is a beacon; one stating its type is noise.

| Role | Holds | Example |
|---|---|---|
| **Fixed value** | A constant, never reassigned | `maxRetries` |
| **Stepper** | Successive values of an iteration | `index` |
| **Walker** | A position traversing a structure | `currentNode` |
| **Most-recent holder** | The latest value seen | `lastReadLine` |
| **Most-wanted holder** | The best so far, by a criterion | `minPrice`, `bestMatch` |
| **Gatherer** | An accumulation over all values | `total`, `errorsFound` |
| **Follower** | The previous value of another variable | `previousLine` |
| **One-way flag** | That an event happened, once — name the event | `hasSeenHeader` |
| **Container** | A collection added to and removed from | `pendingJobs` |
| **Organizer** | A rearrangement of another value | `sortedByDate` |
| **Temporary** | A short-lived value — and it must genuinely be | `swap` |

Anything called `temp`, `data2`, `result2`, or a single letter outside a two-line
scope is a generation artifact — rename before merge.

**Recognisable from the name alone** (the pattern is language-specific, the
distinction is not): use cases are verb-led (`addMember`); permission checks share
a prefix (`can*`) and return a boolean; repositories use identical member names
across entities (read / write / map-to-domain); tests state the behaviour
(`returns_X_when_Y`, never `testFoo1`); handlers share one prefix; boundary modules
carry a suffix so routing and logic never blur.

**Shared vocabulary** — don't invent synonyms (§2.5). Environments are **Local** →
**Sandbox** → **Preproduction** → **Production**. The domain's entity names are fixed
by the tree you're in and declared in its instruction file; use those exact words in
code, tests, schemas and tickets.

---

## 4. Comments

Make the code explain itself; comment only what code *can't* say; delete the rest —
**a stale comment is worse than none.**

**Ladder — stop at the first that works:**

1. **Make it obvious in code**: named booleans, named constants, named helpers,
   guard clauses.
2. **Else comment the *why*** code can't carry: a trade-off, a gotcha ("looks
   wrong, is correct because…"), a spec citation, a one-line public-API doc.
3. **Else it's stale — delete it.**

**Litmus test:** *if the code changed, would this comment have to change too?* Yes
→ narration, delete it. No → anchored outside the code, keep it.

**Never:** algorithm walkthroughs (`1.… 2.…`), restatements (`increment i`),
commented-out code, project history (ticket / sprint / AC tags → commits and
tracker), promissory TODOs (→ file an issue), "confirmed by X on <date>" (→ PR).

> **Generation is now the dominant source of banned comments** — a preamble per
> line, a restatement per block, a numbered walkthrough. Strip it in the pass that
> produced it; never merge it and schedule a cleanup.

**Keep:** a file header — purpose and a pointer to the deciding design record,
**within the cap** (§4.1); *why*-comments on non-obvious correctness; design-record
references
(`ADR-NNN`); lint suppressions **with the rule code**; one-line dividers; **stable
external citations** — a regulation, standard or spec by ID, the one comment form
actively encouraged, because it explains why a value exists and points at something
that won't move; and **`ponytail:`** for a deliberate simplification, naming its
ceiling and upgrade path.

### 4.1 The cap — HARD LIMIT, machine-enforced

**No contiguous comment block exceeds 255 characters of comment text** — every
language, every repo, every comment form (line, block, docstring, doc-comment).

A *why* needing more than ~3 short lines belongs in the spec, ADR or commit
message. Long comments are where narration hides, and narration rots.
Comprehension artifacts go where §2.4 says.

**Two gates, both required:** a **pre-commit hook** blocking comment-heavy commits,
and an **agent write-gate** (`PreToolUse`-style) denying the write before it lands.
**A repo without both is non-conformant.**

**Exemptions:** licence headers, and generated files never hand-edited.

**When bulk-deleting comments,** never strip one the toolchain reads (build tags,
lint pragmas, codegen markers) or one that is a block's entire body. Verify with a
**non-comment token diff** — behaviour-neutral edits pass build and tests; only a
token diff catches them.

---

## 5. Functions, structure, size

- Small, single task, descriptive name, **few arguments** (max ~3; a parameter
  object beyond that), **no side effects** outside their scope. Guard clauses,
  early returns.
- **Top-down flow — callers above callees**; related code close; variables declared
  near use. Delocalisation is the most common avoidable extraneous load.
- Configurable data **high** in the code.
- **Law of Demeter** + **dependency injection** for testable seams. Boundary
  conditions in one place; no hidden dependence on internal state.
- **Isolate concurrency** from business logic.
- **Consistency** — similar things done the same way.
- Prefer **explicit exports**; one entry point re-exports the public API; internal
  helpers unexported; no circular dependencies. Honour the language's
  public/private package split.

| Element | Soft | Hard |
|---|---|---|
| File / module | 300 lines | 500 lines |
| Function / method | 50 lines | 100 lines |
| Test file | 500 lines | 1000 lines |

**5.1 Comprehension refactorings are temporary.** Inlining a callee or rewriting a
dense construct as a plain loop is a legitimate way to *understand* unfamiliar code
— local, uncommitted, reverted by default. Commit it only if it independently
satisfies the budgets above, DRY, and the repo's idiom (for the typed monorepos
here: **functional**, Appendix A.1). Note the asymmetry: a construct is unfamiliar
*to a reader*, not in the abstract. Where the team is fluent, longhand **raises**
load for everyone else; the other valid remedy is to learn it (§2.1).

---

## 6. Formatting & tooling

**Rule zero: the repo's committed formatter/linter config is the authority — it
beats any prose document, including this one.** The config is what actually executes,
so prose disagreeing with it was never in force — fix the prose in the same change
(§13.6).

- **One formatter and one linter per language, config committed, run
  automatically** — auto-fix on edit *and* in the commit gate, so a human, an
  editor and an agent converge. Formatting is never a review topic (§12).
- **Editor baseline** (`.editorconfig`): UTF-8, LF, final newline, trimmed
  trailing whitespace (except Markdown), the language's indent.
- **Deterministic import order:** external → internal → local, alphabetical within
  a group, blank line between groups.
- **No unused imports, variables or dead branches** — the linter catches these, not
  review; generation produces them constantly.
- **No stray print output.** Use the project logger.
- **Never reformat unrelated code** — it destroys the reviewability of both changes.

**Where repos still differ** — follow the local config, don't harmonise a repo
you're passing through: line width (80 / 100 / 120), quote style, semicolons,
trailing commas, one backend on tabs, which type-declaration keyword the lint bans,
and coverage thresholds (§10 sets the intent, CI sets the number). *Settled
everywhere:* the comment cap (§4.1), mutation testing (§10.2), no AI authorship
(§12.1).

---

## 7. Types & contracts

- **Strictest checking the language offers, on.** Where typing is gradual, new code
  is fully typed and existing code tightens as it's touched.
- **No escape hatches** — `any`, untyped map, bare `interface{}`, unchecked cast.
  Use a precise type, or an explicitly unknown one narrowed by a guard.
- **No stacked casts to silence a mismatch:** a double assertion hides a real
  disagreement between two models. Fix with a typed helper, runtime validation or
  an adapter — last resort only, with a comment saying why nothing safer works.
- **Identifiers are branded**, never bare strings or ints, so an order id can't
  pass where a user id belongs. One shared helper creates, checks and unwraps.
- **Validate at every trust boundary with a schema and derive the type from it** —
  never a hand-written type beside a hand-written validator that can drift.
  Boundaries: inbound requests, schemaless columns, file/CLI input, third-party
  responses, cross-service payloads.
- Absent values handled explicitly; no implicit truthiness on nullable data.
- **Public API types are explicit**, never inferred, so a refactor can't silently
  widen the contract.
- **A type is the cheapest beacon there is** (§2.3): it answers at a glance what a
  comment would narrate and a test would have to prove.

---

## 8. Architecture

```
Boundary layer     → transport: decode, validate, authenticate, thin dispatch
      ↓
Domain layer       → use cases, permission checks, business rules
      ↓
Persistence layer  → repositories (read / write / map-to-domain), schema
      ↓
Store
```

- **Thin boundary:** status computation, derived values and aggregation live in
  domain use cases, never in a resolver, controller or route handler.
- **Wire schema separate from storage.** Explicit input and output shapes; **never
  serialize internal or ORM objects directly** — always through a mapper, so
  storage evolves without breaking clients.
- **Batched atomic writes:** persistence writes return *pending operations*; one
  call executes them, transactionally when there's more than one. One logical
  change = one atomic write.
- **A factory creates entities**, populating identity and audit fields (id,
  created-at, created-by) so they can't be forgotten or faked.
- **Ambient request context** carries actor identity and the request clock rather
  than threading them through every signature. **Never read the wall clock for an
  auditable timestamp** — take it from the context, so tests and replays are
  deterministic.
- **Request-scoped batch loaders** prevent N+1; never an ad-hoc cache on a domain
  object.
- **Capability interfaces + pluggable backends:** each resource declares what it
  supports; the store sits behind one interface with swappable implementations
  (in-memory for tests, real for production). Cross-cutting concerns are middleware.
- **Tenancy is enforced server-side**, in the domain or route layer, never trusted
  from the client.
- **Contract synchronisation is a hard rule:** a schema or API change updates every
  impacted layer in the same change — store schema and exports, shared
  types/validators, server routes, client code, generated artifacts. Codegen runs
  *before* type-checking; CI regenerates from scratch, so stale generated code means
  red CI.
- **Migrations:** no schema element the code doesn't use; review the generated DDL;
  edit an unmerged migration in place rather than stacking a corrective one.
- **Abstraction requires a second caller.** Generation makes speculative layers
  free to write and expensive to read; an interface with one implementation and one
  caller is extraneous load with a plausible rationale.

**A data model is unfinished until it has full CRUDL:** create → 201 returning the
resource; read one → 404 if missing; **partial** update, all fields optional;
delete → 204 after clearing dependents; paginated list. Plus explicit
create/read/detail/update schemas, mappers, a create→read→update→delete→list test
at service level, a lifecycle test against the **real** running system,
**referential integrity on delete** centralised in one helper, **relationships as
first-class CRUD** (an attributed edge gets its own id-addressable endpoints,
editable from the UI where one exists), and **invariants enforced on create *and*
re-validated against the merged state on partial update**. Every entry point declares
its parameters, response shapes and error statuses in the schema, so the generated
docs need no prose supplement.

---

## 9. Errors & logging

- **Expected errors are values; throw only for the unexpected.** Not-found,
  not-allowed and invalid-input are part of the return type. Throwing is for
  **invariant violations** — states meaning the code or data is broken.
- **Expected errors appear in the published contract** (result union, typed error
  payload, documented status code) so clients handle them exhaustively. Where a
  response has several shapes the discriminator is explicit, never inferred from
  field presence.
- **Transport error hooks don't catch in-band errors.** A success response carrying
  an error payload won't trigger a network error handler — route both through one
  shared helper, and always request the error fields in the operation.
- Fail loudly with context rather than returning empty. **No silent writes in the
  UI** — every save confirms, and failure is loud and visible.
- **Never leak internals**: no stack traces in production responses; log
  server-side with context instead.
- **Structured logging** with a correlation id propagated across layers, at service
  boundaries not in utilities, covering state transitions and outbound calls.
- **Never log sensitive data** (§11).
- **Swallowed errors are the most expensive generation artifact.** A `catch` that
  logs and continues, or a default substituted for a failed lookup, reads as
  robustness and destroys data. Any error path that neither propagates nor provably
  handles the failure is a defect.

---

## 10. Testing

**TDD is the default: failing test first.** Red → Green → Refactor, one behaviour
per cycle. Red fails **for the right reason** — an assertion failure or the expected
error; a compile error is a *setup* failure. Green is the simplest code that
passes. Never mix refactor with new behaviour.

**Good tests:** one behaviour each, named as behaviour, Arrange-Act-Assert with Act
on one line; **assert what it does, not which private helper it called**; edge cases
as separate tests (empty, boundary, null, off-by-one, idempotent re-call, error
paths); fast and deterministic with clock, randomness, network and filesystem behind
seams; world left as found — fresh state per test, guaranteed cleanup for E2E, since
count-based assertions depend on a clean baseline.

**The pyramid:** unit (pure logic, in-memory, milliseconds) → integration (your code
against **real** runnable dependencies, not mocks) → end-to-end (a full journey
through the running system). **Don't mock what you don't own** — stub only external
boundaries you can't control.

**Aim unit tests at** business-critical and algorithmic logic; calculations on
critical values; branching that fails silently; conversions and mappings (casts,
units, parsing, formatting); boundaries; error and fail-safe paths. Where coverage
is tracked, 80%+ **on critical logic** — not on everything.

**Aim integration tests at** component groups and data flow; contract stability
(payloads, formats, status codes, error behaviour); front↔back chains; and critical
journeys, weighted by product and regulatory risk. Select by **stable test
identifiers, never styling hooks**; wait on the actual call rather than sleeping;
run across browsers; fresh data per test; parallelise; reproducible seed.

### 10.1 Prove the test can fail

A passing test is not evidence. **Any test written after its code must be proven to
fail:** break the implementation deliberately, confirm red for the right reason,
restore.

This is the highest-value guard in an LLM-augmented workflow, because the
characteristic failure isn't a wrong implementation — it's a **test derived from the
implementation instead of the specification**: green by construction, mirroring the
bug, reading perfectly. So state the expected behaviour in words before looking at
the code again, then assert that. A test whose expected values were copied from an
observed run is a snapshot, not coverage of intent — label it as such. Watch for
assertions that pass forever: non-null, mock-was-called, shape-without-value.

### 10.2 Mutation testing

Coverage asks "was this line run"; mutation asks "would a change here be caught".
**It audits the tests, closes the TDD loop, and is the only systematic detector of
the vacuous tests above.** Expected practice in every repo and language with a
mutator.

Run it **scoped to one file** once that file's suite is green. Each survivor is
either a **real gap** — sharpen the test — or an **equivalent** that doesn't change
observable behaviour: mark it ignored, don't chase it. Repeat until only equivalents
survive.

**Target ≥ 80% on pure modules**, as a quality signal rather than a per-commit gate;
nightly or on demand. **Scope to pure deterministic code** — reducers, diff engines,
parsers, validators, canonicalizers, business rules. **Never mutate glue** (I/O,
database, network, framework wiring, time, randomness); cover that with integration
and E2E. A high survivor count means shallow tests — that diagnostic is the point.

### 10.3 Environment

- **Container-first where declared:** a run outside containers is fast feedback and
  **not authoritative**; PRs and CI pass the containerised suite against real
  dependencies.
- **Type-checking is not behavioural proof.** Behavioural changes to domain or
  persistence code are verified by running the affected **integration suite** — a
  refactor can be fully type-valid and still change runtime behaviour. Rebuild the
  artifact the runtime actually serves, restart it, seed, run. Touched a *shared*
  use case? Run the other suites that exercise it.
- **Know when CI runs which suite.** Suites that only run in a merge queue show as
  skipped on the PR and a force-merge bypasses them — so the **local integration run
  is the primary pre-merge signal** for behavioural change.
- Never point tests at a production store.
- **API work is test-first:** contract, integration and error-path tests before
  implementation, treating the published schema as the behavioural contract. Cover
  happy *and* negative paths per endpoint — malformed body, unauthenticated,
  forbidden, not-found, unprocessable, rate-limited, server error without leaking
  internals. Assert status **and** body, assert no extra fields, and test auth
  handling, tenant isolation, scopes, idempotency and usage accounting.

---

## 11. Security, privacy, compliance

- **Never log, print or transmit sensitive data in plaintext** — nor in error
  messages, monitoring events, traces or debug output. Opaque identifiers and
  structured field-level redaction.
- **No semantic identifiers in URLs, query params, headers or referrers** (names,
  national identifiers, dates of birth). Opaque UUIDs are fine.
- **Never commit secrets.** Environment variables or a secret manager; keys in a
  KMS; rotated at least annually. Secret and private-key scanning in the commit gate.
- **Never trust client-provided identity.** Resolve user, tenant and roles from the
  authenticated session; authorize server-side at the domain boundary on **every**
  request; least privilege, role-based at every layer.
- **Parameterized queries only** — concatenated SQL is forbidden. Server-side
  validation through the shared validators, allow-list for sensitive fields. CSRF
  protection on cookie-authenticated mutations. Request/response size limits;
  reject over-complex queries.
- **Encrypt in transit (TLS 1.2+, prefer 1.3) and at rest (AES-256 or equivalent)**
  with vetted libraries — **no custom crypto**, no deprecated algorithms (MD5,
  SHA-1, DES, 3DES, RC4) for security purposes.
- **Append-only audit logs** for access, creation, modification and deletion of
  sensitive data, carrying UTC timestamp, actor id, action, resource type and id,
  correlation id. Deletion or modification of audit records is forbidden in
  application code *and* by store permissions. Alert on bulk reads, off-hours and
  cross-tenant access, and lockouts. Log failed authn/authz with enough context to
  investigate — never the submitted credentials.
- **UTC with explicit timezone handling** for time-critical logic.
- **Session timeout per role** — short for admin consoles, longer for operational
  workflows — with **step-up re-authentication before sensitive actions** (export,
  bulk operations, privileged settings). MFA for administrative access and first
  login. Persistent device trust only when device-bound and revocable, and it never
  bypasses step-up.
- **Client-side caches holding sensitive data are in-memory only** — never local or
  session storage, IndexedDB, cookies or service-worker caches — and cleared on
  logout and session expiry.
- **Static analysis and dependency scanning on every PR.** Never deploy unmitigated
  critical/high findings; **never suppress a finding to go green.** Threat-model new
  sensitive features and require security review for them.
- **Pin dependencies exactly**; CI actions and base images by digest. **Verify a
  dependency exists and is the package you mean before adding it** — a plausible,
  non-existent or typo-adjacent name is a routine generation artifact and a live
  supply-chain vector. Check registry, repository, download history, maintainer.
- **Immutable, signed, minimal, patched images**; never root in production; network
  segmentation; a WAF in front of public surfaces. Local container development is
  exempt from hardening, and that exemption never ships anywhere shared.
- **Data minimisation and purpose limitation**; pseudonymisation or anonymisation
  wherever the purpose allows; secure deletion and right to erasure; retention driven
  by the applicable regulation, not a fixed global number.
- **Synthetic data for development and test**, and synthetic seed identities.
  Production-derived data only when anonymised through a controlled, audited,
  pre-refresh-reviewed pipeline, then treated as *pseudonymised* under
  production-grade access controls.
- **Never paste sensitive data into a model context** — real user data,
  production dumps, secrets, credentials. Synthetic or redacted only. Where a hosted
  model necessarily receives operational context, that is an explicit, documented,
  risk-assessed trade-off, never an incidental one.
- **Verify integrity** (checksums, signed exports) for sensitive data leaving the
  boundary; encrypt backups, test restoration on a schedule, store them in
  geographically separate certified locations.
- **Annotate security-relevant code with the rule id it implements** so a control
  traces to its requirement.
- **Controls apply by default.** Exceptions only when risk-assessed, documented in
  the rules file or an ADR, and approved. Controlled trade-offs, never silent ones.

---

## 12. Git, commits, PRs, review

**Branches.** **Solo repos may commit to the default branch** — with no second reader
a PR is ceremony (§1, rung 1). **Solo is asserted, not assumed:** a second contributor,
or branch protection being enabled, restores the requirement the same day. Everywhere
else, feature branch + PR, always, and never bypass branch protection. Committing
direct does not relax §13.1's floor — the diff is still read at line level before it
lands, now before the commit rather than in a PR. The name carries the ticket —
`feat/TEC-123`, `fix/TEC-456`, `hotfix/TEC-789`; without a tracker, `feature/<desc>`,
`fix/<desc>`, `chore/<desc>`, `docs/<desc>`, `refactor/<desc>`. **Rebase; never merge
the default branch into a feature branch** — a merge commit mixes other people's
changes into your diff and makes it unreviewable. Fetch, rebase, force-push **with
lease**. **After resolving conflicts, verify nothing leaked**: conflict resolution
silently renames fields and changes enum values, so diff against the default branch
and confirm only expected files changed.
For multi-PR features, **stack** — each PR's base is the previous branch, merge order
bottom-up, both stated in the description.

**Commits — Conventional Commits, consumed by release automation:**

```
<type>(<scope>): <subject>

[body]

[footer]
```

Types: `feat` (minor), `fix` (patch), `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `deps`, `revert`; a `!` or a `BREAKING CHANGE:` footer →
major. **Scope is the ticket id** where traceability matters, otherwise the
component. Subject ≤ ~50 characters, imperative, specific; body explains **what and
why, not how**; issues in the footer; **one logical change per commit.** Never
`fixed stuff`, `WIP` or `updates` in merged history. Don't hand-edit versions —
merge the release PR.

### 12.1 No AI authorship in git history — absolute

**Never add a `Co-Authored-By:` trailer, or any byline crediting a model, assistant
or tool as an author of a commit. Every repo, every agent, always** — no default-on
case, no per-repo opt-in. A commit is audit evidence; a trailer naming a model
muddies the chain tying it to a requirement and a reviewer.

**Authorship credit is banned; process metadata is not.** A **"Model Used"** field is
*required* where a PR template has one, and tracker-comment disclosure is mandatory
where a project requires it. **Nothing in the commit object; disclosure lives where a
human can weigh it.**

**Pull requests.** Draft by default — never auto-create a PR, flip draft↔ready,
request reviewers or merge without explicit per-request permission. **Keep PRs
small:** cheap generation makes large diffs effortless to produce and impossible to
review, and the reviewer's working memory did not get bigger (§2.2). Split by
intent; never bundle an unrequested refactor with a behaviour change.
**Self-review at line level first.** Then describe what, why and how; link tickets;
state known gaps and the follow-ups that close them; fill in **every** template
section. **Tests must pass before review-ready** — if they can't run that's a
blocker: push back, and if overridden say plainly that shipping without passing
tests is a serious risk, and confirm.

**Review.** Within 24h. **Substance over style** — linters own style, you own logic,
architecture and bugs. Describe the risk or consequence rather than flagging
"wrong"; **prefer a question** over a verdict; approve with minor comments rather
than blocking on trivia; defer where you lack context. **Check:** correctness and
logic; edge cases and error handling; impact on shared components; regressions on
existing journeys, including readability and flow for end users; security;
performance; test coverage **and whether its level fits the change**; naming (§3).
**For machine-generated diffs, two more:** can you state each block's plan in one
sentence (§2.5), and what did you confirm at a glance versus trace (§2.3)?
**Authors:** respond to every comment, keep each status clear, resolve promptly, and
don't take it personally.

---

## 13. Working with generative tools

Everything above applies unchanged to generated code. This is what's specific to
producing it.

### 13.1 Where unreviewed generation is allowed

"Vibe-coding" in its original sense — accepting output without reading it — is
legitimate for throwaway work and disqualifying for everything else. Permission is
set by the **risk class of the code**, not by how confident the session feels.

| Class | What puts code in it | Unread generation |
|---|---|---|
| Throwaway / exploratory | Written to be deleted; nothing ships, nothing depends on it | **Fine.** Don't gold-plate it either. |
| Own work under a quality bar | Kept and maintained, governed by its own instruction file | **No** — that file sets the bar, and it is higher than this one. |
| Client and product code | Someone other than you depends on it running correctly | **Never.** |
| Regulated | Covered by a specification, standard or audited process | **Never**, and generation is disclosed and reviewed (§12.1). |

Vendored and reference trees are read-only — fork rather than modify; the fork then
takes a class of its own.

**A path does not carry its own risk class.** Which directories fall in which class
is a property of the tree you are working in, not of this document. Declare it in the
repo's instruction file or in the agent's configuration, where a tool can read it and
act on it. **Anything unclassified is client and product code** — the default fails
closed, because the cost of misclassifying downward is unbounded.

**Promotion is a rewrite.** Throwaway code doesn't become compliant by being moved; it
re-enters through §1 and the full gate, or gets binned for the small version.

**The floor everywhere below row one: no unread merges.** A human has read, at line
level, every changed line in the paths that matter — trust boundaries, auth, money,
sensitive data, migrations, deletion, anything regulated. Read at chunk and plan level
first (§2.3, §2.5), then descend to lines there.

### 13.2 Prompt the failure, not the task

The model has the same three failure modes you do (§2.1), with the same distinct
remedies. Diagnose before re-prompting; repeating the request louder fixes none.

| Missing | Symptom | Remedy |
|---|---|---|
| **Knowledge** | Invents an API, flag, version, code system, unit | Give it the authority — spec, schema, doc page, actual header. Never let it infer a fact that has a source. |
| **Information** | Plausible code ignoring an existing helper, convention or caller | Give it the *code*, not a description of it: the file, the slice, the caller, the instruction file. Most "it ignored our patterns" failures are this. |
| **Capacity** | Locally coherent, globally wrong; loses constraints late in a long task | Decompose. One behaviour per exchange, state offloaded to a durable artifact rather than held in the conversation. |

**Session state is not evidence.** A model's summary of its own earlier work —
including "I verified X" — is a claim: re-read the file before editing after a gap,
re-run the check rather than trusting that it ran. Long sessions degrade; prefer
several scoped sessions with a written hand-off.

### 13.3 Plan first; then review the diff, not the chat

**Before generation** on anything beyond a trivial edit, state a plan rejectable in
one read: focal point, files it will touch, the invariant it must not break, blast
radius, and the test written first. No plan, no generation.

**After generation, the diff is the only artifact under review.** The accompanying
explanation is fluent, confident, and produced by the same process that produced the
code — it cannot corroborate it. Approving on the strength of a summary is the
characteristic failure of this era. Read the diff; run the check yourself; where they
disagree, the diff is right. **"It passes" is a claim until you've seen the output** —
report what actually ran, and say plainly what didn't and why.

### 13.4 Verify facts, remember patterns

Don't look up **syntax** mid-flow — that's what memory and the model are for, and the
interruption costs more than it saves (§2.1).

Always look up, and never accept generated, anything with an **authority**: API
surfaces, parameter names, model identifiers, pricing, limits, version behaviour,
deprecations; standards, code systems and units — a code, its display name, its
preferred unit, its conversion; regulatory and specification identifiers; whether a
package exists and is the one you mean (§11). **Cite the authority by stable ID**
where a value's existence depends on it.

### 13.5 Standing rules

- **Ask every time** for commit, push, opening a PR, marking a PR ready, requesting
  reviewers, merging, installing dependencies, updating tickets. **Permission is
  per-request and never carries over.** Reading tickets needs no permission;
  changing them does.
- **§14 is the exit contract**, not a summary — run it before hand-off, and **state
  explicitly whatever couldn't run, and why.**
- **The local gate mirrors CI, and the gate is the contract.** Never `--no-verify`,
  never merge past required checks. It runs format, secret scan, **full** lint (not a
  fast subset — the skipped rules are exactly the ones needing type information),
  build, security scans, race-enabled tests, and the comment gate (§4.1).
- **Never blind-rename** — reference-aware tools only. **Destructive operations are
  triple-safe:** back the data up outside the repo, confirm the source of truth is
  intact and recoverable, *then* proceed. Confirm before, not after.
- **External-system ethics:** never automate another person's credentials or 2FA;
  respect rate limits and terms of service; go human-paced on sensitive endpoints;
  stop at any access or limit wall; touch only data you're authorized to.
- Where a code-intelligence index exists, impact analysis before editing a symbol and
  change detection before committing are mandatory; HIGH or CRITICAL risk halts and
  surfaces; prefer graph queries over grep; **no silent fallback** to grep-only if the
  tooling is down — halt.
- Propose, don't auto-run, manual browser testing. Keep plan documents in
  `doc/plans/YYYY-MM-DD-slug.md`.

### 13.6 Instruction files are infrastructure

`AGENTS.md` / `CLAUDE.md` are read on every task by every agent, and are subject to
the same cognitive limits as code. **The deepest applicable file wins** for a
directory.

- **State the why where the rule would otherwise be disobeyed** — counterintuitive,
  costly, or contradicting a plausible instinct. Germane load is what makes a rule
  survive an unfamiliar case (§2.2); everywhere else it's padding that pushes the
  file past being read.
- **Reconcile prose with config in the same change.** Where they disagree the config
  wins (§6) *and the prose gets fixed immediately*. A known contradiction left in
  place trains every reader to distrust the file.
- **Length is a correctness property.** Past a size an instruction file stops being
  followed in full. Prefer card-plus-body layering: invariants up front, detail
  addressable, per-stack bindings in an appendix.
- **A repeatedly violated rule is a badly written rule.** Rewrite it, move it
  earlier, or enforce it in a hook — hooks beat prose for anything mechanical. Prose
  is for judgment.
- **Record discoveries where they'll be re-read.** A hard-won gotcha goes into the
  instruction file in the same PR — not a comment, not the conversation.

---

## 14. Definition of done

- [ ] Ladder climbed; smallest sufficient diff in the *right* place; no unrequested
      abstractions or dependencies.
- [ ] **Plan stateable in one sentence** per changed block; entities map to the
      domain vocabulary.
- [ ] Failing test written first. Any test written after its code: **deliberately
      broken and observed red.** No assertions that pass forever.
- [ ] Behaviour verified by the real integration suite, not a type-check. Pure
      modules: mutation ≥ 80%, survivors equivalent.
- [ ] Full CRUDL, schemas, mappers, lifecycle tests; delete safety; invariants on
      create *and* update. Contracts synced; codegen run.
- [ ] Lint, type-check and build clean on **every** file touched; no runtime warnings
      in the client.
- [ ] Names state roles; every non-trivial block has a beacon; no `temp` / `data2` /
      single letters outside a two-line scope.
- [ ] No narration comments; every comment passes the litmus test and the
      255-character cap, with both gates installed.
- [ ] Every external fact verified against its authority — APIs, versions, code
      systems, units, package existence — cited by ID where the value depends on it.
- [ ] No secrets; no sensitive data in logs, URLs, errors or a model context;
      authorization server-side; dependencies pinned and verified; scans green.
- [ ] Diff scope verified; validation layer not bypassed; destructive operations
      triple-safe. **Diff read at line level in the paths that matter** — not approved
      from a summary.
- [ ] Docs and instruction files updated where behaviour, commands or a new gotcha
      changed them. Commit carries **no AI authorship trailer**; disclosure fields
      filled.
- [ ] Root cause fixed, not the symptom; regression guard left behind. Anything unrun
      or unfixed stated plainly, not papered over.

---

## 15. Anti-patterns

**Inherited from a codebase that drifted into all of them** — review triggers, in any
language: two competing HTTP-client approaches in one app; duplicated components
beside mutualised ones; inconsistent use of a shared-behaviour mechanism; clickable
non-links; state piled into a root store instead of modules; components carrying too
much logic; functions mixing levels of abstraction; styling split across
component-local, stylesheet and framework classes with no rule; dead code from an
aborted refactor; misuse of globals; hand-rolled and schema-based validation side by
side; unexplained dependencies; TODOs as the real bug tracker; inconsistent component
naming; a startup sequence with no retry path that logs the user out on any failure.

**Generation-era** — each reads well, which is the problem: approving from the summary
rather than the diff; **speculative abstraction** (one implementation, one caller,
added "for extensibility"); **tests derived from the implementation**, green by
construction, mirroring the bug; **swallowed errors** logged and continued past;
**hallucinated or typo-adjacent dependencies**; the **one-shot mega-diff**, cheap to
generate and impossible to review; **unrequested refactors bundled** into a behaviour
change; **correct-but-unrecognisable** constructions nobody can chunk; and **trusting
the session** — "I already verified that" offered as evidence.

---

# Appendix A — language bindings

Each entry implements the canon for one stack; none overrides §1–15. The repo's
committed config remains authoritative (§6).

## A.1 TypeScript / JavaScript

- **Tooling:** ESLint 9 flat config + a stylistic plugin, shared as an internal
  config package, auto-fixed on every edit. Prettier where configured — settings
  vary, read the local file.
- **Format:** 2-space indent; semicolons; one-true-brace; **single quotes** including
  JSX attributes (the lint-enforced truth even where prose says otherwise); trailing
  commas on multiline; a blank line before every `export`; newline after the last
  import; one import declaration per line.
- **Import order:** external + builtin (workspace scopes count as external) →
  internal alias (`~/*`) → index/sibling/parent; alphabetical, case-insensitive,
  blank line between groups. No extraneous dependencies.
- **Casing:** `camelCase` modules, `PascalCase.ts` for type-resolver files,
  `kebab-case` for scripts/components/feature folders; `camelCase` variables and
  functions; `PascalCase` types and components; `SCREAMING_SNAKE_CASE` constants and
  enum values.
- **Types:** strict; the lint-enforced type-declaration keyword; no `any` —
  `unknown` + a guard; `import type` for type-only imports; Zod at boundaries with
  `z.infer`; branded ids through the shared model helpers.
- **Style: functional** — pure functions, composition, promise chains; classes only
  where a framework demands them. This is the idiom §5.1 protects.
- **Repositories:** `read.ts`, `write.ts`, `toDomain.ts`. **Logging:** the shared log
  package; `no-console` warns. **Mutator:** Stryker, scoped per file.

## A.2 Frontend (React and similar)

- Props as a local, non-exported type object destructured in the signature; children
  via the framework helper; extension by intersection.
- Components are **functions**, PascalCase, named exports. Keys: unique id > unique
  property > composite; index last resort.
- **Compiler-optimised builds: no manual memoisation** unless measured. An IIFE for a
  complex derived value.
- **No hardcoded user-facing strings** — namespaced translations per feature, typed
  accessor with a fallback, keys in **every** locale. Conditional classes via the
  shared helper.
- **Design tokens only** — never hardcoded colours, sizes or spacing. Read the token
  definitions first; prefer design-system components over native controls.
- Route files hold routing only (loader, meta, a delegating default export); UI logic
  lives in the feature's page module. **Feature folders** once a feature has 3+
  components or multiple hooks/utils/constants:
  `features/<name>/{components,hooks,api,constants,utils,types,mocks,pages}`.
- Stable `data-testid` hooks for E2E; never CSS classes.

## A.3 Python

- **Modern:** ruff for lint *and* format (line length 120, pinned target,
  `select = ["E","F","I","W"]`, double quotes) + mypy. **Legacy:** black + isort +
  flake8 (line length 120; isort 88, multi-line mode 3, trailing comma, declared
  first-party) + mypy with `check_untyped_defs`, `warn_unused_ignores`,
  `warn_redundant_casts`.
- PEP 8; `snake_case`, `PascalCase` classes, `SCREAMING_SNAKE_CASE` constants; type
  hints on public functions. 4-space indent, 2 for HTML/CSS/JSON/YAML.
- Pre-commit: trailing whitespace, EOF fixer, YAML and merge-conflict checks,
  large-file check, **private-key detection**, secret scanning, mypy (strict for new
  files, gradual for modified), plus project gates such as linting seed templates for
  accidental sensitive data.
- Templates: page logic in the template, complex transforms in helpers; escape by
  default; no inline scripts. **Mutator:** mutmut or cosmic-ray.

## A.4 Go

- `gofmt` + `goimports` with `local-prefixes` set to the module path.
- `golangci-lint` v2 with `errcheck, govet (enable-all minus fieldalignment),
  staticcheck, ineffassign, bodyclose, durationcheck, errname, errorlint, exhaustive,
  gocritic (diagnostic+style+performance), misspell, nilerr, prealloc, unconvert,
  unparam, whitespace`; relaxed for `_test.go` and `testdata/`.
- `go vet ./...` before committing; race-enabled tests, `gosec` and `govulncheck`
  pinned to CI's versions. Tools live in `$(go env GOPATH)/bin` — put it on `PATH` or
  the hooks exit 127.
- **Exported symbols get a one-line doc comment.** Never strip toolchain comments
  (`//go:*`, `//nolint`, `//exhaustive:ignore`, build tags).
- `pkg/` is the public API, `internal/` private. Provider + capability interfaces;
  middleware as interceptors; every error response a valid domain resource.
- **Mutator:** options are weak — apply §10.2 where one runs, lean on integration
  coverage and §10.1 elsewhere.

## A.5 Legacy PHP

`.editorconfig` baseline, **4-space indent** (2 for YAML). Read-mostly: §15's
inherited catalogue came largely from this generation. Follow the existing local style
for a minimal fix; don't propagate the patterns.

---

# Appendix B — sources

**Cognitive model (§2)** follows Felienne Hermans, *The Programmer's Brain* (Manning,
2021), and the work it synthesises: Sweller (cognitive load), Chase & Simon
(chunking), Brooks (beacons), Sajaniemi (roles of variables), Pennington
(text-structure vs plan knowledge), Weiser (slicing).

Which repo each rule was distilled from is in this document's git history, where it
can't go stale. Restating it here would name trees the canon is not allowed to know
about.





---

# Appendix C — this repository

**What it is.** A static Astro site that explains how data flows inside a hospital
information system, through layered isometric SVG figures in the style of the
`anatomy` skill (https://github.com/wheresryan22/anatomy), each accompanied by
descriptive text. Source material: the "SI hôpital — Flux interne + externe" diagram.

**Stack.** Astro (static output), TypeScript strict, Node 22, pnpm. Figures are
built at build time from pure geometry modules that import the anatomy kit copied
into `src/iso/`. No React.

**Commands.**

```
pnpm install          # pinned lockfile
pnpm dev              # local server
pnpm build            # static site into dist/
pnpm check            # astro check (types)
pnpm test             # node --test over src/**/*.test.ts
```

**Layout.**

| Path | Role |
|---|---|
| `src/iso/` | Vendored anatomy kit (`iso-kit.ts`, `iso.css`). Read-only: fork a copy rather than edit. |
| `src/content/departments.ts` | The truth: the eight departments, their functions, flows and summaries. Every figure and page reads from it. |
| `src/figures/hospital-floor/` | Figure 1. `model.ts` (plans, walls, doors as pure data) and `model.test.ts`; `camera.ts` (the one projection); `parts.ts`, `furniture.ts`, `equipment.ts` (recipes); `shell.ts`, `structure.ts` (baseboard, floors, walls, trunking); `rooms/<room>.ts`; `build.ts` (card HTML); `tour.ts` + `live.ts` (client motion). |
| `src/components/` | One Astro component per figure: renders the card with `set:html` and loads its `live.ts`. |
| `src/figures/hospital-floor/devices.ts`, `cables*.ts`, `cableLabels.ts`, `trunkPaths.ts`, `packets.ts` | The Logiciels / Données / Réseau layers drawn in the floor itself: screen-bearing anchor devices per room (`screenQuadOf`), cables on the trunking bundled by lane, label pills with one text per layer, packets on the active room's cables. `DESIGN.md` records the visual decisions. |
| `src/pages/`, `src/layouts/` | Astro routing and shell only. |
| `shots/` | Screenshots from the anatomy capture scripts. Gitignored. |

**Verifying a figure.** Build, serve with `pnpm preview --port <free>`, then run the
anatomy skill's `scripts/capture.mjs` (desktop, 390 px, hover, 4× `--zoom` close-ups)
and `scripts/lines.mjs` (must print `line ends: 0`) against it, and read every PNG.
The skill lives at `~/.claude/skills/anatomy/`.

**Language.** Everything the visitor reads is French (page chrome, panel, summaries,
legend); the source diagram's acronyms and payload names stay as printed. Code,
identifiers, comments, tests, README and this file stay English (§3).

**Risk class (§13.1).** Everything under `src/` is *own work under a quality bar*:
read every generated line. `src/iso/` is vendored and read-only.

**Domain vocabulary (§3).** The entities are the hospital systems named in the
source diagram. Use these exact names and acronyms in code, content and tests:

| Acronym | Name | Functions |
|---|---|---|
| GAM | Gestion Administrative des Malades | Identité patient, Admissions/Sorties, Mouvements |
| RDV | Gestion des rendez-vous | Planification, Consultations, Ressources |
| DPI | Dossier Patient Informatisé | Données cliniques, Observations, Séjours |
| SGL | Système de Gestion de Laboratoire | Analyses, Résultats, Prescriptions bio |
| PACS/RIS | Picture Archiving and Communication System / Système d'information radiologie | Images médicales, Radiologie, Comptes-rendus, Prise de rendez-vous, Facturation |
| Pharmacie | Pharmacie | Prescriptions, Ordonnances, Stocks |
| Bloc | Gestion Bloc Opératoire | Programmation, Interventions, Comptes-rendus |
| EAI | Enterprise Application Integration | Orchestration, Transformation, Routage |

Flows between them are HL7 v2 (ADT, ORU, scheduling, pharmacy, surgical reports)
and DICOM (images + metadata). These acronyms are domain terms and exempt from the
no-acronym rule.

**Orchestration.** A Fable or Opus session never writes code itself. It plans,
delegates to sub-agents (Sonnet at xhigh effort for real work, Haiku for trivial
edits), reviews their diffs line by line and owns the result.

**Known gaps.** The comment-cap hooks (§4.1), ESLint config (§6) and translation
layer (A.2) are not yet installed. Add them before a second contributor joins.
