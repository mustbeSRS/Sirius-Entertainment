/** Optional provider boundary. No model, API key or paid provider is enabled. */
export type CoachRequest = {
  task: "topics" | "metaphors" | "imagery" | "feedback" | "structure";
  selectedText: string;
  instructions: string;
  shareConsent: true;
};
export type CoachSuggestion = { label: string; text: string; generated: true };
export interface CreativeCoachProvider {
  readonly name: string;
  readonly model: string;
  suggest(
    request: CoachRequest,
    signal: AbortSignal,
  ): Promise<CoachSuggestion[]>;
}
export const aiAvailability = {
  enabled: false,
  reason: "No AI provider has been approved or configured.",
} as const;
export function validateCoachRequest(input: CoachRequest) {
  if (!input.shareConsent)
    throw Error("Explicit text-sharing consent required");
  if (input.selectedText.length > 12000 || input.instructions.length > 1000)
    throw Error("Request exceeds context limit");
}
// Future providers must stay server-only and implement authenticated per-artist quotas,
// timeout/cost logging and output labels before this feature can be enabled.
