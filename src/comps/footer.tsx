import Image from "next/image";

export default function Footer({ supportLink }: { supportLink?: string }) {
  return (
    <footer className="w-full flex flex-col items-center justify-center py-10 px-4 bg-[#272628] font-Matter">
      <div className="w-full flex flex-row items-center justify-between">
        <div className="flex flex-col gap-2">
          <Image
            src="/images/l2LabsLogo.svg"
            alt="Stacks Logo"
            width={100}
            height={100}
          />
        </div>
        <div className="flex flex-row gap-4">
          {supportLink && (
            <a
              suppressHydrationWarning
              href={supportLink}
              target="_blank"
              rel="noreferrer"
              className="text-midGray font-light text-sm"
            >
              Live support
            </a>
          )}
          <a
            key="how-to-use"
            href="https://docs.stacks.co/guides-and-tutorials/sbtc/how-to-use-the-sbtc-bridge"
            target="_blank"
            rel="noreferrer"
            className="text-midGray font-light text-sm"
          >
            How to use this bridge
          </a>
          <a
            key="docs"
            href="https://docs.stacks.co/concepts/sbtc"
            target="_blank"
            rel="noreferrer"
            className="text-midGray font-light text-sm"
          >
            Docs
          </a>
          <a
            key="github"
            href="https://github.com/stacks-network/sbtc"
            target="_blank"
            rel="noreferrer"
            className="text-midGray font-light text-sm"
          >
            Github
          </a>
        </div>
      </div>
    </footer>
  );
}
