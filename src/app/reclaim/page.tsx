"use server";
import Faqs from "@/comps/Faqs";

import ReclaimManager from "@/comps/reclaim/reclaim-manager";

export default async function Home() {
  return (
    <>
      <ReclaimManager />
      <Faqs />
    </>
  );
}
