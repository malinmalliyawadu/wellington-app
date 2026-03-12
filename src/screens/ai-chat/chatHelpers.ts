const CATEGORY_ICONS: Record<string, { sf: any; fallback: any }> = {
  cafe: { sf: "cup.and.saucer.fill", fallback: "cafe" },
  restaurant: { sf: "fork.knife", fallback: "restaurant" },
  bar: { sf: "wineglass.fill", fallback: "wine" },
  attraction: { sf: "star.fill", fallback: "star" },
  park: { sf: "leaf.fill", fallback: "leaf" },
  venue: { sf: "music.note", fallback: "musical-notes" },
  trail: { sf: "figure.hiking", fallback: "walk" },
  shop: { sf: "bag.fill", fallback: "bag" },
};

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good afternoon", emoji: "🌤️" };
  return { text: "Good evening", emoji: "🌙" };
}

function getSuggestionChips(): {
  label: string;
  emoji: string;
  description: string;
  question: string;
}[] {
  const hour = new Date().getHours();

  const chips: {
    label: string;
    emoji: string;
    description: string;
    question: string;
  }[] = [];

  chips.push({
    label: "Weekend plans",
    emoji: "📅",
    description: "Find things to do this weekend",
    question: "What should I do this weekend?",
  });

  if (hour < 11) {
    chips.push({
      label: "Coffee spot",
      emoji: "☕",
      description: "Find a cosy cafe nearby",
      question: "Where can I get a good coffee nearby?",
    });
    chips.push({
      label: "Breakfast",
      emoji: "🍳",
      description: "Start the day right",
      question: "What's a good breakfast spot?",
    });
  } else if (hour < 14) {
    chips.push({
      label: "Lunch",
      emoji: "🍽️",
      description: "Great spots for a midday meal",
      question: "Where's good for lunch?",
    });
    chips.push({
      label: "Coffee spot",
      emoji: "☕",
      description: "Find a cosy cafe nearby",
      question: "Where can I get a good coffee nearby?",
    });
  } else if (hour < 17) {
    chips.push({
      label: "Afternoon out",
      emoji: "🌿",
      description: "Ideas for the afternoon",
      question: "What's good for an afternoon outing?",
    });
    chips.push({
      label: "Coffee spot",
      emoji: "☕",
      description: "Find a cosy cafe nearby",
      question: "Where can I get a good coffee nearby?",
    });
  } else {
    chips.push({
      label: "Dinner",
      emoji: "🍽️",
      description: "Where to eat tonight",
      question: "Where's good for dinner tonight?",
    });
    chips.push({
      label: "Drinks",
      emoji: "🍻",
      description: "Bars and nightlife nearby",
      question: "What's a good bar for drinks tonight?",
    });
  }

  chips.push({
    label: "Events",
    emoji: "🎉",
    description: "What's happening in Welly",
    question: "What events are happening soon?",
  });
  chips.push({
    label: "Hidden gems",
    emoji: "💎",
    description: "Off the beaten track spots",
    question: "Show me some hidden gems in Wellington",
  });

  return chips.slice(0, 4);
}

/**
 * Clean incomplete markdown syntax from the end of streaming text.
 * Instead of stripping incomplete links (which hides lots of streamed text),
 * convert them to plain text so content stays visible while streaming.
 */
function trimIncompleteMarkdown(text: string): string {
  let result = text;

  // 1. Incomplete markdown links: convert partial `[text](url` to plain text
  //    Find the last `[` that isn't part of a complete `[text](url)` link
  const lastOpen = result.lastIndexOf("[");
  if (lastOpen !== -1) {
    const afterOpen = result.slice(lastOpen);
    if (!/^\[[^\]]*\]\([^)]*\)/.test(afterOpen)) {
      // Extract whatever link text exists and show it as plain text
      const linkTextMatch = afterOpen.match(/^\[([^\]]*)/);
      const plainText = linkTextMatch?.[1] ?? "";
      result = result.slice(0, lastOpen) + plainText;
    }
  }

  // 2. Incomplete bold: trailing ** without closing pair — strip the **
  const lastBold = result.lastIndexOf("**");
  if (lastBold !== -1) {
    const afterBold = result.slice(lastBold + 2);
    if (!afterBold.includes("**")) {
      result = result.slice(0, lastBold) + afterBold;
    }
  }

  // 3. Incomplete italic: trailing single * without closing pair — strip the *
  const lastStar = result.lastIndexOf("*");
  if (
    lastStar !== -1 &&
    result[lastStar - 1] !== "*" &&
    result[lastStar + 1] !== "*"
  ) {
    const afterStar = result.slice(lastStar + 1);
    if (!afterStar.includes("*")) {
      result = result.slice(0, lastStar) + afterStar;
    }
  }

  return result;
}

const CHAT_STORAGE_KEY = "ai_chat_history";

export {
  CATEGORY_ICONS,
  getGreeting,
  getSuggestionChips,
  trimIncompleteMarkdown,
  CHAT_STORAGE_KEY,
};
