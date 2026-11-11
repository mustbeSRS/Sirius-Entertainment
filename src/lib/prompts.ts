export const senses = [
  "Sight",
  "Sound",
  "Touch",
  "Smell",
  "Taste",
  "Movement",
  "Atmosphere",
  "Emotion",
];
const objects: Record<string, string[]> = {
  Sight: [
    "a cracked mirror",
    "the last light in a window",
    "a road disappearing into dusk",
  ],
  Sound: [
    "a kettle calling into an empty room",
    "an unanswered ringtone",
    "footsteps beyond a closed door",
  ],
  Touch: ["salt drying on skin", "a fraying sleeve", "the cold edge of a key"],
  Smell: [
    "rain lifting from warm stone",
    "cardamom in the hallway",
    "smoke in a borrowed jacket",
  ],
  Taste: [
    "coffee gone cold",
    "salt on a bitten lip",
    "the sweetness of a remembered fruit",
  ],
  Movement: [
    "a tide learning to retreat",
    "a train leaving before dawn",
    "a curtain breathing in a window",
  ],
  Atmosphere: [
    "a city waiting for rain",
    "the silence after an argument",
    "an empty stage before the lights",
  ],
  Emotion: [
    "relief arriving too late",
    "the courage to stay",
    "a familiar place becoming strange",
  ],
};
export function prompts(
  tool: string,
  theme: string,
  mood: string,
  sense: string,
  variation: number,
) {
  const topic = theme.trim() || "belonging";
  const items = objects[sense] || objects.Sight;
  const rotated = items.map((_, i) => items[(i + variation) % items.length]);
  if (tool === "Metaphors")
    return rotated.map(
      (o) =>
        `Explore ${topic} as ${o}. What does it protect, reveal, or leave behind? Keep the tone ${mood.toLowerCase()}.`,
    );
  if (tool === "Similes")
    return rotated.map(
      (o) =>
        `“${topic} feels like ${o}…” Finish the comparison with an unexpected action. Try a ${mood.toLowerCase()} angle.`,
    );
  if (tool === "Imagery")
    return rotated.map(
      (o) =>
        `Start with ${o}. Describe one precise detail that suggests ${topic} without naming it.`,
    );
  if (tool === "Structure")
    return [
      `Try an opening scene → a change in perspective → a returning image. Where does ${topic} shift?`,
      `Let the chorus state the emotional center. Give each verse a different consequence of ${topic}.`,
      `Remove one repeated section. Does a quieter ending better serve a ${mood.toLowerCase()} mood?`,
    ];
  return [
    `Tell a story about ${topic} from the viewpoint of someone who has just changed their mind.`,
    `What small object could hold your experience of ${topic}? Give it a voice.`,
    `Write about ${topic} through what is missing. Begin with a ${mood.toLowerCase()} scene and end with a question.`,
  ];
}
