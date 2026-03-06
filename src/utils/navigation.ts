import type { Router } from "expo-router";

/**
 * Dismiss a modal/sheet and then push a new route after the dismiss animation completes.
 * The iOS sheet dismiss animation takes ~300ms — we wait 350ms to be safe.
 */
export function dismissAndPush(
  router: Router,
  ...pushArgs: Parameters<Router["push"]>
) {
  router.dismiss();
  setTimeout(() => {
    router.push(...pushArgs);
  }, 150);
}
