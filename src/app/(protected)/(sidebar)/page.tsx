import Header from "@/components/header/Header";
import dynamic from "next/dynamic";

const CreateRoomDialog = dynamic(
  () => import("@/components/pages/CreateRoomDialog"),
  {
    ssr: !!false,
  }
);

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
