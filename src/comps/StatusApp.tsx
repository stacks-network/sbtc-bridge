"use client";

import { SECTION } from "@/comps/HomeApp";
import { SectionAction } from "@/comps/HomeSelectedHeader";
import Status from "./Status";

type SECTION_DATA = {
  title: string;
};

const sectionsMap = new Map<SECTION, SECTION_DATA>();
sectionsMap.set(SECTION.STATUS, { title: "Status" });

const StatusApp = () => {
  const selectedSectionData = sectionsMap.get(SECTION.STATUS);

  if (selectedSectionData === undefined) {
    return null;
  }

  return (
    <>
      <div className="flex flex-1 flex-col w-full px-5 gap-6 items-center pt-5">
        <div className="flex  flex-row items-center justify-center">
          <SectionAction
            section={SECTION.STATUS}
            activeSection={SECTION.STATUS}
            text="Status"
          />
        </div>
        <div className="w-screen flex "></div>
        <Status />
      </div>
    </>
  );
};

export default StatusApp;
