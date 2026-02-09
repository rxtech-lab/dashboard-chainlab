import { getSession } from "@/lib/auth";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "../ui/breadcrumb";
import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";
import { User } from "./user";
import { cookies } from "next/headers";
import { type SessionResponse } from "web3-connect-react";

export async function SiteHeader() {
  const cookie = await cookies();
  const session = (await getSession(cookie)) as SessionResponse;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 self-stretch"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <User address={session.walletAddress!} />
        </div>
      </div>
    </header>
  );
}
