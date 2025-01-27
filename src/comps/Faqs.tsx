"use client";
import { useState } from "react";

type FAQItemProps = {
  question: string;
  answer: React.ReactNode;
  index: number;
};

const faqs = [
  {
    question: "What is sBTC?",
    answer:
      "sBTC is a non-custodial 1:1 Bitcoin-backed asset on the Stacks Bitcoin Layer.",
  },
  {
    question: "How does sBTC work?",
    answer: (
      <ol className="list-inside flex flex-col gap-4">
        <li>
          sBTC is a SIP-010 token on the Stacks blockchain that represents
          Bitcoin (BTC) in a 1:1 ratio. sBTC is always backed 1:1 against BTC.
        </li>
        <li>
          The sBTC peg wallet is maintained and managed by a set of sBTC
          signers. This decentralized approach enhances security and reduces
          single points of failure.
        </li>
      </ol>
    ),
  },
  {
    question: "Is my BTC safe?",
    answer: (
      <>
        <p className="text-darkGray font-Matter font-thin mb-4">
          sBTC is always backed 1:1 against BTC, and it’s verifiably secure
          through threshold cryptography. sBTC removes the need for 3rd party
          custodian or trusted setup. Instead, BTC is secured by a decentralized
          signer set.
        </p>
        <p className="text-darkGray font-Matter font-thin mb-4">
          Partnerships with top-tier security experts have been established to
          ensure the protocol is fortified at every level:
        </p>
        <ol className="list-decimal list-inside flex flex-col gap-4">
          <li>
            <strong>Asymmetric Research:</strong> Known for their rigorous
            research and protocol audits, Asymmetric brings security expertise
            to sBTC to identify and mitigate potential vulnerabilities.
          </li>
          <li>
            <strong>ImmuneFi:</strong> A robust bug bounty program incentivizes
            ethical hackers to uncover and address potential issues, adding an
            additional layer of defense.
          </li>
          <li>
            <strong>3rd Party Audits:</strong> Independent audit reports will be
            completed for additional security reviews, ensuring the protocol is
            thoroughly vetted by external experts.
          </li>
        </ol>
      </>
    ),
  },
  {
    question: "How long will it take for my BTC deposit to confirm?",
    answer: (
      <>
        <p className="text-darkGray font-Matter font-thin mb-4">
          sBTC facilitates rapid movement between BTC and sBTC.
        </p>
        <ol className="list-inside flex flex-col gap-4">
          <li>
            BTC to sBTC conversions are typically completed within 3 Bitcoin
            blocks. Due to the speed of Bitcoin blocks, deposits can take up to
            two hours to see sBTC in your wallet.
          </li>
          <li>
            sBTC to BTC conversion can be completed within 6 Bitcoin blocks
            (Approximately two hours)
          </li>
        </ol>
      </>
    ),
  },
  {
    question: "What wallets are supported for sBTC?",
    answer: (
      <>
        <ol className="list-inside flex flex-col gap-4">
          <li>
            <a
              className="text-blue-600 underline"
              href="https://www.xverse.app/"
              target="_blank"
            >
              Xverse
            </a>{" "}
            and{" "}
            <a
              className="text-blue-600 underline"
              href="https://leather.io/"
              target="_blank"
            >
              Leather
            </a>{" "}
            wallets are supported — two leading wallets with seamless
            integrations designed for Bitcoin and Stacks users.
          </li>
          <li>
            <a 
              className="text-blue-600 underline"
              href="https://www.asigna.io/"
              target="_blank"
            >
              Asigna Multisig
            </a>{" "} 
            is also supported on both the Bitcoin and Stacks sides, providing
            reliable functionality for multisig setups.
          </li>
          <li>
            We are actively working with institutional custodians, staking
            providers, and other 3rd party wallets to support sBTC. More will be
            announced.
          </li>
        </ol>
      </>
    ),
  },
  {
    question: "Is there a minimum amount of BTC I must deposit?",
    answer: (
      <p className="text-darkGray font-Matter font-thin">
        Yes. A .01 BTC minimum is imposed for BTC to sBTC deposits.
      </p>
    ),
  },
  {
    question: "Are there any associated fees with minting sBTC?",
    answer: (
      <ol className="list-inside flex flex-col gap-4">
        <li>
          There are two transaction fees required to mint your sBTC. The first
          is set by the user manually when they initiate the deposit transaction
          within their wallet.
        </li>
        <li>
          The second is a fee used to consolidate the deposit UTXOs into the
          single signer UTXO. This separate transaction fee happens
          automatically and is set to a max of 80k sats. This is automatically
          deducted from your minted sBTC. This is not a signer fee but a regular
          Bitcoin transaction fee.
        </li>
      </ol>
    ),
  },
];

const FAQItem = ({ question, answer, index }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="">
      <p className="text-darkGray font-Matter font-normal tracking-wider">
        {`FAQ ${index}`}
      </p>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="faq-question flex justify-between text-black items-center w-full py-4 text-left text-lg font-medium"
      >
        <span>{question}</span>
        <svg
          className={`faq-icon w-6 h-6 transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>
      <div
        className={` overflow-hidden transition-all duration-300 ${
          isOpen ? "h-max" : "h-0"
        }`}
      >
        <div className="p-6 bg-[#F5F5F5] rounded-xl w-full">
          <div className=" text-[#605D5D]">{answer}</div>
        </div>
      </div>
    </div>
  );
};

const Faqs = () => {
  return (
    <div
      style={{
        backgroundColor: "white",
      }}
      className="w-full  pt-10 flex flex-col items-center justify-center"
    >
      <div
        style={{
          maxWidth: "800px",
        }}
        className="w-full mb-8 flex-col flex  gap-4  rounded-2xl font-Matter "
      >
        <div className="flex flex-1 gap-4 px-8 p-6 flex-col ">
          <div className="w-full flex flex-row items-center justify-between">
            <h1 className="text-2xl text-black font-Matter font-normal">
              Learn more about sBTC
            </h1>
          </div>
          <p className="text-darkGray font-Matter font-thin text-sm">
            Enter into the world of sBTC with these resources
          </p>
        </div>
        <div className="flex flex-col w-full px-8 p-6 gap-4  mt-5">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              index={index + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Faqs;
