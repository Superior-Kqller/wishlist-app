import { signOut } from "next-auth/react";

export function signOutToLogin() {
  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  return signOut({
    callbackUrl: currentOrigin ? `${currentOrigin}/login` : "/login",
  });
}
