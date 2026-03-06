const WEBSITE_HOST = (
  process.env.EXPO_PUBLIC_WELLY_WEBSITE_URL || "https://wellyapp.nz"
)
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

const PATH_MAP: Record<string, (id: string) => string> = {
  post: (id) => `/feed/post/${id}`,
  place: (id) => `/feed/place/${id}`,
  user: (id) => `/feed/user/${id}`,
  event: (id) => `/events/${id}`,
  guide: (id) => `/feed/guide/${id}`,
  trail: (id) => `/map/trail/${id}`,
};

function resolveDeepLinkPath(url: string): string | null {
  // Match website universal links: https://wellyapp.nz/<type>/<id>
  const websiteMatch = url.match(
    new RegExp(
      `https?://${WEBSITE_HOST.replace(/\./g, "\\.")}/(post|event|place|user|guide|trail)/([^/?#]+)`
    )
  );
  if (websiteMatch) {
    const [, type, id] = websiteMatch;
    const mapper = PATH_MAP[type];
    if (mapper) return mapper(id);
  }

  // Match wellington:// deep links: wellington://<type>/<id>
  const deepLinkMatch = url.match(/wellington:\/\/\/?(\w+)\/([^/?#]+)/);
  if (deepLinkMatch) {
    const [, type, id] = deepLinkMatch;
    const mapper = PATH_MAP[type];
    if (mapper) return mapper(id);
  }

  return null;
}

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string {
  const resolved = resolveDeepLinkPath(path);

  if (resolved) {
    if (initial) {
      // Cold start: store the target and let the app boot normally through auth.
      // AuthGate will pick this up and navigate after session is ready.
      (global as any).__pendingDeepLink = resolved;
      return "/";
    }
    return resolved;
  }

  return path;
}
