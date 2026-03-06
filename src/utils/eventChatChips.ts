export type EventChip = { label: string; emoji: string; question: string };

export function getEventChips(title: string, category?: string): EventChip[] {
  const common: EventChip[] = [
    { label: "Food nearby", emoji: "🍽️", question: `Where should I eat near ${title}?` },
    { label: "Getting there", emoji: "🚶", question: `How do I get to ${title}?` },
  ];

  switch (category) {
    case "music":
      return [
        { label: "About the artist", emoji: "🎵", question: `Tell me about the artist playing at ${title} — what genre are they, what are their top songs?` },
        { label: "What to expect", emoji: "🎶", question: `What can I expect at ${title}? What's the vibe like?` },
        ...common,
      ];
    case "comedy":
      return [
        { label: "About the comedian", emoji: "😂", question: `Tell me about the comedian performing at ${title} — what's their style?` },
        { label: "What to expect", emoji: "🎭", question: `What can I expect at ${title}?` },
        ...common,
      ];
    case "art":
      return [
        { label: "About the show", emoji: "🎨", question: `Tell me about ${title} — what kind of art or performance is it?` },
        { label: "What to expect", emoji: "✨", question: `What can I expect at ${title}?` },
        ...common,
      ];
    case "food":
      return [
        { label: "What's on the menu", emoji: "🍴", question: `What food and drinks will be at ${title}?` },
        { label: "Dietary options", emoji: "🥗", question: `Are there vegetarian or vegan options at ${title}?` },
        { label: "What to expect", emoji: "🍽️", question: `What can I expect at ${title}?` },
        { label: "Getting there", emoji: "🚶", question: `How do I get to ${title}?` },
      ];
    case "market":
      return [
        { label: "What's there", emoji: "🛒", question: `What kind of stalls and vendors will be at ${title}?` },
        { label: "What to expect", emoji: "🎪", question: `What can I expect at ${title}? How big is it?` },
        ...common,
      ];
    case "quiz":
      return [
        { label: "How it works", emoji: "🧠", question: `How does ${title} work? Do I need a team?` },
        { label: "What to expect", emoji: "❓", question: `What can I expect at ${title}?` },
        ...common,
      ];
    case "kids":
      return [
        { label: "Age range", emoji: "👶", question: `What age range is ${title} suitable for?` },
        { label: "What to expect", emoji: "🎈", question: `What can I expect at ${title}? What activities are there?` },
        ...common,
      ];
    case "cultural":
      return [
        { label: "About the event", emoji: "🌏", question: `Tell me about ${title} — what's the cultural significance?` },
        { label: "What to expect", emoji: "🎭", question: `What can I expect at ${title}?` },
        ...common,
      ];
    case "craft":
      return [
        { label: "What we'll make", emoji: "🧵", question: `What will I make or learn at ${title}?` },
        { label: "What to bring", emoji: "🎒", question: `Do I need to bring anything to ${title}?` },
        ...common,
      ];
    case "community":
      return [
        { label: "What's involved", emoji: "🤝", question: `What's involved at ${title}? Who's it for?` },
        { label: "What to expect", emoji: "🏘️", question: `What can I expect at ${title}?` },
        ...common,
      ];
    default:
      return [
        { label: "What to expect", emoji: "🎯", question: `What can I expect at ${title}?` },
        { label: "Similar events", emoji: "🎉", question: `What other events are similar to ${title}?` },
        ...common,
      ];
  }
}
