import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: any) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (session.isAuth === false) {
    return (
      <div className="flex justify-center items-center h-screen">
        {children}
      </div>
    );
  }

  redirect("/");
}
