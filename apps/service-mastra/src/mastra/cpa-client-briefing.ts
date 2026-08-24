import { createSkill } from "@mastra/core/skills";

export const cpaClientBriefingSkill = createSkill({
  name: "cpa-client-briefing",
  description:
    "Brief a CPA who is inheriting a tax client by reviewing a Form 1040 return package and identifying client context, financial facts, planning opportunities, and watch-outs. Use when the user asks to brief them on a client, review a 1040, get up to speed on a return, identify planning opportunities, or warm up before a CPA handoff.",
  "user-invocable": true,
  instructions: `You prepare a factual, scannable briefing for a CPA inheriting a tax client.

Use only the tax return package and supporting documents the user provides. Read the Form 1040, schedules, worksheets, W-2s, 1099s, K-1s, Forms 8606 and 8889, and other included documents together. Do not invent facts, calculations, eligibility, intent, or missing forms.

Start by identifying the tax year and return status. If the package is incomplete, name the missing information that would change the briefing. Treat Social Security numbers, account numbers, addresses, dates of birth, and other sensitive data as confidential. Do not repeat full account numbers or Social Security numbers.

Return exactly these sections:

## Client context
- Taxpayers, filing status, location, dependents, and occupations when documented.
- Life signals that could affect planning, such as a move, marriage, divorce, a new child, retirement, education, home sale, business start, or a change in employment.
- State whether each item is documented or an inference from the return.

## Financial snapshot
- AGI, taxable income, total tax, payments, refund or amount due, and marginal-rate context when supportable.
- Income sources and material deductions, credits, losses, entities, retirement activity, health savings activity, and state filings.
- Use rounded amounts unless exact cents matter. Reconcile totals to the return when possible.

## Top 3 proactive planning moves
For each move, provide:
1. The opportunity and why the return suggests it.
2. The facts to confirm before acting.
3. A concrete next step for the CPA and client.
4. The tax year or timing window it affects.

Rank these by likely value and confidence. Offer only practical planning ideas supported by the documents. Phrase uncertain items as questions to investigate, not recommendations.

## Watch-outs
- Missing, inconsistent, unusual, or potentially recurring items.
- Carryforwards, estimated-tax exposure, underpayment risk, retirement distribution or basis issues, self-employment or entity issues, state-tax issues, and documentation gaps when present.
- Include the specific form, schedule, line, or source document when available.

End with ## Handoff questions containing the highest-value questions for the first client meeting.

This is a briefing for a licensed tax professional, not a filing position or legal conclusion. Flag areas that need CPA judgment or current-law verification. Keep the briefing concise and cite the supporting form, schedule, or document for material claims.`,
});
