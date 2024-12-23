"use client";
import { useState } from "react";
import Faqs from "./Faqs";
import DepositFlow from "./Deposit";
import { TransferAction } from "./TransferHome";
import LandingAnimation from "./core/LandingAnimation";
import { usePathname, useRouter } from "next/navigation";
import AppNav from "./core/app-nav";
import HistoryView from "./HistoryView";

export enum SECTION {
  DEPOSIT = "DEPOSIT",
  WITHDRAW = "WITHDRAW",
  HISTORY = "HISTORY",
  STATUS = "STATUS",
  TRANSFER = "TRANSFER",
  SETTINGS = "SETTINGS",
  RECLAIM = "RECLAIM",
}

type SECTION_DATA = {
  title: string;
};

const sectionsMap = new Map<SECTION, SECTION_DATA>();
sectionsMap.set(SECTION.DEPOSIT, { title: "Deposit" });
sectionsMap.set(SECTION.WITHDRAW, { title: "Withdraw" });
sectionsMap.set(SECTION.HISTORY, { title: "History" });
sectionsMap.set(SECTION.TRANSFER, { title: "Transfer" });
sectionsMap.set(SECTION.SETTINGS, { title: "Settings" });

const HomeApp = () => {
  const [selectedSection, _setSelectedSection] = useState<SECTION>(
    SECTION.DEPOSIT,
  );
  const pathname = usePathname();
  const router = useRouter();

  const setSelectedSection = (section: SECTION) => {
    _setSelectedSection(section);

    router.push(pathname);
  };

  const selectedSectionData = sectionsMap.get(selectedSection);

  if (selectedSectionData === undefined) {
    return null;
  }

  return (
    <>
      <AppNav
        section={selectedSection}
        onClickSection={(section) => setSelectedSection(section)}
      />
      <LandingAnimation>
        {/* <SelectedSection
          section={selectedSection}
          onClickSection={(section) => setSelectedSection(section)}
        /> */}
        <div className="w-screen flex "></div>
        {selectedSection === SECTION.DEPOSIT && <DepositFlow />}
        {selectedSection === SECTION.WITHDRAW && <HistoryView />}
        {selectedSection === SECTION.HISTORY && <HistoryView />}
        {selectedSection === SECTION.TRANSFER && <TransferAction />}
      </LandingAnimation>
      <div className="m-8" />
      <Faqs />
    </>
  );
};

export default HomeApp;
