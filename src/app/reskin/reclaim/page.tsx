"use server";
import Faqs from "@/comps/Faqs";

import ReclaimManager from "@/comps/reskin/reclaim/reclaim-manager";

export default async function Home() {
  return (
    <>
      <ReclaimManager />
      <Faqs />
    </>
  );
}
