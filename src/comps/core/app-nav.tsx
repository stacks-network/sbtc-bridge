import { classNames } from "@/util";
import { SECTION } from "../HomeApp";
import { SectionActionProps, SectionSelection } from "../HomeSelectedHeader";

const NavTile = ({
  section,
  activeSection,
  text,
  onClickSection,
}: SectionActionProps) => {
  return (
    <div
      onClick={() => onClickSection && onClickSection(section)}
      className="w-96 relative  h-full flex items-center justify-center cursor-pointer"
    >
      <h3 className="font-Matter  text-md text-white font-thin tracking-wide">
        {text}
      </h3>
      <div
        className={classNames(
          "absolute bottom-[-4px] w-full h-1 ",
          section === activeSection ? "bg-darkOrange" : "bg-white",
        )}
      />
    </div>
  );
};
const AppNav = ({ section, onClickSection }: SectionSelection) => {
  const handleClickSection = (section: SECTION) => {
    onClickSection(section);
  };
  return (
    <div
      style={{
        borderTop: "1px solid rgba(255, 255, 255, 0.2)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
      }}
      className="w-full bg-[#272628] h-20 flex items-center justify-center
      "
    >
      <NavTile
        section={SECTION.DEPOSIT}
        activeSection={section}
        text="DEPOSIT"
        onClickSection={handleClickSection}
      />
      <NavTile
        section={SECTION.WITHDRAW}
        activeSection={section}
        text="WITHDRAW"
        onClickSection={handleClickSection}
      />
      <NavTile
        section={SECTION.HISTORY}
        activeSection={section}
        text="HISTORY"
        onClickSection={handleClickSection}
      />
    </div>
  );
};

export default AppNav;
