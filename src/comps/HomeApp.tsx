"use client";
import { useState } from "react";
import Faqs from "./Faqs";
// import SelectedSection from "./HomeSelectedHeader";
import DepositFlow from "./Deposit";
import { TransferAction } from "./TransferHome";
import LandingAnimation from "./core/LandingAnimation";

// import { usePathname, useRouter } from "next/navigation";

export enum SECTION {
  DEPOSIT = "DEPOSIT",
  WITHDRAW = "WITHDRAW",
  HISTORY = "HISTORY",
  STATUS = "STATUS",
  TRANSFER = "TRANSFER",
  SETTINGS = "SETTINGS",
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
  // const pathname = usePathname();
  // const router = useRouter();

  // const setSelectedSection = (section: SECTION) => {
  //   _setSelectedSection(section);

  //   router.push(pathname);
  // };

  const selectedSectionData = sectionsMap.get(selectedSection);

  if (selectedSectionData === undefined) {
    return null;
  }

  return (
    <>
      <LandingAnimation>
        {/* <SelectedSection
          section={selectedSection}
          onClickSection={(section) => setSelectedSection(section)}
        /> */}
        <div className="w-screen flex "></div>
        {selectedSection === SECTION.DEPOSIT && <DepositFlow />}
        {selectedSection === SECTION.WITHDRAW && <p>Coming Soon :)</p>}
        {/* {selectedSection === SECTION.HISTORY && (
          <p className="text-center text-lg mb-4 font-Matter font-bold text-black">
            Coming Soon :)
          </p>
        )} */}
        {selectedSection === SECTION.TRANSFER && <TransferAction />}
      </LandingAnimation>

      <Faqs />
    </>
  );
};

export default HomeApp;
