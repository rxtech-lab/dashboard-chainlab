import { getSession } from "@/lib/auth";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "../ui/breadcrumb";
import { SidebarTrigger } from "../ui/sidebar";
import { User } from "./user";
import { cookies } from "next/headers";
import { SessionResponse } from "web3-connect-react";

interface Props {
  breadcrumbs: {
    title: string;
    url: string;
  }[];
}

const Header = async ({ breadcrumbs }: Props) => {
  const cookie = await cookies();
  const session = (await getSession(cookie)) as SessionResponse;

  return (
    <header className="w-full border-b border-gray-100 sticky top-0 bg-white backdrop-blur-md">
      <div className="px-4 py-4 flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <div className="h-6 w-[1px] bg-gray-200" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb) => (
                <BreadcrumbItem key={breadcrumb.url}>
                  <BreadcrumbLink href={breadcrumb.url}>
                    {breadcrumb.title}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <User address={session.walletAddress!} />
      </div>
    </header>
  );
};

export default Header;
