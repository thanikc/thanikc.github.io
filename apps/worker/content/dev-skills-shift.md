# From Code Review to Outcome Verification

AI changes more than the speed at which software is produced. It challenges the assumption that software quality can primarily be established through human inspection of source code.

When implementation becomes cheap and code generation outpaces human review capacity, manual inspection can no longer remain the default control mechanism.

The alternative is not unreviewed code. It is a different model of verification.

## The Verification Model

- **Specifications define the intended behavior.** Explicit state machines, decision tables, and contracts state what the system must do, including its boundaries and constraints.
- **Evidence shows the implementation satisfies its requirements.** Automated tests, static analysis, security checks, and evaluations provide that evidence continuously, not once at review time.
- **Runtime monitoring and risk-based human intervention cover what remains.** Some failures cannot be reliably eliminated before deployment. Monitoring detects them in production, and human attention goes to the changes where the risk justifies it.

## What Changes for the Engineer

The engineer's responsibility shifts from inspecting every implementation detail to designing and maintaining a verification system that makes software quality measurable, failures detectable, and residual risks explicit.

| Engineering Focus    | Before: Inspecting the code                                 | After: Verifying the outcome                                                        |
| :------------------- | :---------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| **Primary craft**    | Writing clean code and mastering implementation detail      | Writing unambiguous specifications that agents cannot misinterpret                  |
| **Quality control**  | Line-by-line human review of every pull request             | A verification system: tests, static analysis, security checks, and evaluations     |
| **Testing**          | Written after implementation to confirm it works            | The test suite is the specification and the source of truth for agents and humans   |
| **Failure handling** | Catch defects before merge, assume the rest will not happen | Detect failures at runtime with monitoring, and make residual risk explicit         |
| **Human attention**  | Spread evenly across all code                               | Concentrated where risk is highest: security boundaries, data, irreversible actions |
| **Debugging**        | Stepping through self-written logic                         | Diagnosing runtime behavior and system context across machine-generated code        |
| **Domain knowledge** | Familiarity with local classes, idioms, and helpers         | System architecture and operational context that no spec or test captures yet       |

## Qualities of an Engineer in This Model

- **Specification and intent design.** Defining inputs, state transitions, and edge cases precisely. A requirement without boundaries leaves an agent to guess at rate limits, security rules, and failure modes.
- **Verification design.** Choosing which tests, checks, and evaluations make a given behavior provable, and keeping them trustworthy as the codebase changes.
- **Adversarial thinking.** Challenging green results with adversarial tests and dedicated harnesses, since a passing suite only proves what it actually checks.
- **Risk judgment.** Deciding where human review still earns its cost, and stating which risks remain after verification.
- **Architectural stewardship.** Keeping the team fluent in the system's design, data flow, and contracts even when individual lines were machine-generated.

## Summary Thought

> _The primary object of engineering is no longer the code itself, but the verified behavior of the system._
