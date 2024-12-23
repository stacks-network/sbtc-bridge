"use client";

import { classNames } from "@/util";

import { SECTION } from "./HomeApp";

const sectionTextStyle = (isActive: boolean) =>
  isActive ? "text-black  font-semibold" : "text-gray font-normal";
const sectionStyle = (isActive: boolean) =>
  isActive ? " border-orange" : " border-gray";

export type SectionActionProps = {
  section: SECTION;
  onClickSection?: (section: SECTION) => void;
  activeSection: SECTION;
  text: string;
};
export const SectionAction = ({
  section,
  activeSection,
  text,
  onClickSection,
}: SectionActionProps) => {
  return (
    <div
      onClick={() => onClickSection && onClickSection(section)}
      className={classNames(
        "w-32 cursor-pointer h-14 flex flex-row items-center justify-center border-b-2",
        sectionStyle(section === activeSection),
      )}
    >
      <h1
        className={classNames(
          " text-2xl",
          sectionTextStyle(section === activeSection),
        )}
      >
        {text}
      </h1>
    </div>
  );
};

export type SectionSelection = {
  section: SECTION;
  onClickSection: (section: SECTION) => void;
};
const SelectedSection = ({ section, onClickSection }: SectionSelection) => {
  const handleClickSection = (section: SECTION) => {
    onClickSection(section);
  };
  return (
    <div className="flex  flex-row items-center justify-center">
      <SectionAction
        section={SECTION.DEPOSIT}
        activeSection={section}
        text="Deposit"
        onClickSection={handleClickSection}
      />
      {/* <SectionAction
        section={SECTION.WITHDRAW}
        activeSection={section}
        text="Withdraw"
        onClickSection={handleClickSection}
      /> */}
      {/* <SectionAction
        section={SECTION.HISTORY}
        activeSection={section}
        text="History"
        onClickSection={handleClickSection}
      /> */}
      {/* <SectionAction
        section={SECTION.TRANSFER}
        activeSection={section}
        text="Transfer"
        onClickSection={handleClickSection}
      /> */}
      {/* <SectionAction
        section={SECTION.SETTINGS}
        activeSection={section}
        text="Settings"
        onClickSection={handleClickSection}
      /> */}
    </div>
  );
};

export default SelectedSection;
