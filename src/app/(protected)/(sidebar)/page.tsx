import Header from "@/components/header/Header";
import { Metadata } from "next";
import dynamic from "next/dynamic";

const CreateRoomDialog = dynamic(
  () => import("@/components/pages/CreateRoomDialog"),
  {
    ssr: !!false,
  }
);

export const metadata: Metadata = {
  title: "Home",
  description: "Home",
};

export default function Home() {
  return (
    <>
      <Header breadcrumbs={[{ title: "Home", url: "/" }]} />
      <div className="bg-white mx-auto w-full px-10">
        <div className="mt-10 flex justify-end">
          <CreateRoomDialog />
        </div>
      </div>
    </>
  );
}
