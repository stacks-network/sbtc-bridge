"use server";
import Faqs from "@/comps/Faqs";

import RecoverManager from "@/comps/recover";

export default async function Home() {
  return (
    <>
      <RecoverManager />
      <Faqs />
    </>
  );
}
