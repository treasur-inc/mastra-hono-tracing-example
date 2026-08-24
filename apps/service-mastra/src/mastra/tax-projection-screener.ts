import { createSkill } from "@mastra/core/skills";

export const taxProjectionScreener = createSkill({
  name: "tax-projection-screener",
  description:
    "Determine whether a client on extension needs a tax projection before April 15.",
  instructions: `
Use this skill when deciding whether an extension client needs a tax projection by April 15.

Review the complete prior-year return and all available current-year documents. Do not infer facts that are not documented.

Return YES when the prior return or current-year documents show any of the following:
1. Self-employment income.
2. Realized investment gains.
3. Rental income.
4. K-1 income.
5. A prior-year balance due of at least $1,000.
6. A current-year income type that was not reported on the prior-year return.
7. Missing prior-year return or current-year documents needed to rule out the conditions above.

Return NO only when both the prior-year return and current-year documents were reviewed and none of the conditions apply.

Use this exact response format:
Decision: YES or NO
Reasons: short list of triggered conditions, or "No trigger found."
Evidence: document name, tax year, and relevant line, form, or page for each reason.
Missing documents: list missing items, or "None."

This is a screening result, not a tax calculation or filing position. Do not prepare a projection. When the decision is YES, hand off to the tax-projection workflow or a qualified tax professional.
`,
});
