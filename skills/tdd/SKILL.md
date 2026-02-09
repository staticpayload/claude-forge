---
name: tdd
description: Test-Driven Development enforcement — write tests first, always
---

<Purpose>
Enforce the Red-Green-Refactor cycle. NO production code without a failing test first.
The discipline IS the value. Tests drive the design.
</Purpose>

<Use_When>
- User says "tdd", "test first", "red green refactor"
- Implementing new features that should be test-driven
- User wants disciplined test-first development
</Use_When>

<Cycle>

## RED: Write a Failing Test
1. Write ONE test for the next piece of behavior
2. Run the test — it MUST fail
3. If it passes, the test is wrong or the feature already exists
4. The failing test defines what "done" looks like

## GREEN: Make It Pass
1. Write the MINIMUM code to make the test pass
2. No extra features, no optimization, no "while I'm here"
3. Run the test — it MUST pass now
4. If it doesn't pass, keep iterating (don't add more tests yet)

## REFACTOR: Clean Up
1. Now that it works, improve the code
2. Extract functions, rename variables, remove duplication
3. Run ALL tests — they must still pass
4. If tests break during refactor, you went too far — revert and try smaller

## REPEAT
Go back to RED with the next piece of behavior.

</Cycle>

<Rules>
1. **NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.** This is non-negotiable.
2. **One test, one feature per cycle.** Don't batch.
3. **Minimum code in GREEN.** Don't gold-plate.
4. **All tests pass in REFACTOR.** No regressions.
5. **Tests are first-class code.** Clean, readable, well-named.
</Rules>

<Output_Format>
For each cycle, show:
```
--- RED ---
Test: [test name]
File: [test file path]
Result: FAIL (expected)

--- GREEN ---
Implementation: [what was added]
File: [source file path]
Result: PASS

--- REFACTOR ---
Changes: [what was improved]
Tests: ALL PASS (N tests)
```
</Output_Format>
