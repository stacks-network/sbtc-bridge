"use server";
import Reclaim from "@/comps/Reclaim";

export default async function Home() {
  return (
    <main className="min-w-screen bg-white  flex items-center flex-col min-h-screen ">
      <Reclaim />
    </main>
  );
}
