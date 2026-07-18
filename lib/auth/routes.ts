export const SIGN_IN_ROUTE = "/sign-in";
export const SIGN_UP_ROUTE = "/sign-up";
export const EDITOR_ROUTE = "/editor";
export const POST_SIGN_OUT_ROUTE = SIGN_IN_ROUTE;

export function isPublicAuthRoute(pathname: string) {
  return (
    pathname === SIGN_IN_ROUTE ||
    pathname.startsWith(`${SIGN_IN_ROUTE}/`) ||
    pathname === SIGN_UP_ROUTE ||
    pathname.startsWith(`${SIGN_UP_ROUTE}/`)
  );
}
