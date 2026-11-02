import type { Metadata } from "next";
import HomePage from "@/components/HomePage";

export const metadata: Metadata = {
  alternates: { canonical: "https://www.myuniqart.com/" },
  robots: { index: true, follow: true }
};

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.myuniqart.com/#website",
  name: "MyUniQart",
  alternateName: ["UniQart", "My UniQart"],
  url: "https://www.myuniqart.com/"
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website).replace(/</g, "\\u003c") }}
      />
      <HomePage />
    </>
  );
}
