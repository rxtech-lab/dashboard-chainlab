import { getSession } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession(await cookies());
  if (session.isAuth === false) {
    const currentPath = (await headers()).get("x-current-path");
    redirect(`/auth?redirect=${currentPath}`);
  }
  return <>{children}</>;
}
