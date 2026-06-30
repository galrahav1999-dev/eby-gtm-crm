/**
 * Exit criteria for each pipeline stage: the bar a record must clear to advance.
 * Shown as hover help on the board column headers so the team knows when to move
 * a card forward. Keyed by the field's optionsKey, then by the stage value.
 *
 * Plain language, no jargon. Update here and every board updates.
 */
export const STAGE_GUIDE: Record<string, Record<string, string>> = {
  b2b_stage: {
    "1 Discovery":
      "You have spoken to someone at the org and captured their current Hebrew situation and their pains in their own words.",
    "2 Qualified":
      "Confirmed a real pain, a budget owner, and a plausible timeline. This is a genuine opportunity, not just polite interest.",
    "3 Demo/Validated":
      "They have seen EBY and agreed it fits their need. A champion is emerging on their side.",
    "4 Pilot/LOI":
      "A pilot or letter of intent is agreed, with a success metric and a date to convert to paid.",
    "5 Proposal":
      "A written proposal or contract is with the economic buyer for sign-off.",
    "6 Closed Won":
      "Signed and moving to delivery. Record the reason it closed so we can repeat it.",
    "6 Closed Lost":
      "No longer moving forward. Record the reason so we learn from it.",
  },
  pilot_stage: {
    Identified: "A pilot candidate is named with a champion willing to run it.",
    "Agreed (DPA)": "The pilot is agreed and the data processing agreement is signed.",
    Onboarding: "Accounts and classes are being set up to start.",
    Active: "The pilot is running and feedback is coming in on the agreed cadence.",
    Converted: "The pilot proved its value and converted to a paid deal.",
    Churned: "The pilot ended without converting. Note why.",
  },
  partner_stage: {
    Identified: "A potential partner is named with a clear reason they help us reach learners.",
    Pitched: "We have pitched the partnership and they understand the value exchange.",
    Agreement: "Terms are agreed, in writing where possible.",
    Enabled: "They have what they need to send us reach, referrals, or access.",
    Productive: "The partnership is producing real reach or referrals.",
    Dropped: "No longer pursuing this partnership. Note why.",
  },
};

/** The exit-criteria map for a stage field, or an empty object if none. */
export function stageGuide(optionsKey?: string): Record<string, string> {
  return (optionsKey && STAGE_GUIDE[optionsKey]) || {};
}
