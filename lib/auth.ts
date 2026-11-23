import { cookies } from "next/headers";
import { LOGIN_COOKIE, sessionUser, AuthenticationError } from "./access";
export { AuthenticationError } from "./access";
export async function authenticatedUser() {
  return sessionUser((await cookies()).get(LOGIN_COOKIE)?.value);
}
export async function currentUser() {
  const id = await authenticatedUser();
  if (!id) throw new AuthenticationError();
  return id;
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    const source = new URL(origin);
    if (
      !["http:", "https:"].includes(source.protocol) ||
      source.host !== (request.headers.get("host") || new URL(request.url).host)
    )
      throw Error("Cross-origin request rejected.");
  }
}
