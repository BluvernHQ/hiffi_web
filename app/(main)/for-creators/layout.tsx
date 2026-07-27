import { Poppins } from "next/font/google";
import AboutSiteFooter from "../about/components/hiffi-about/about-site-footer";
import "../about/hiffi-about.css";
import "./for-creators.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export default function ForCreatorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add("joyjam-rem-scale")`,
        }}
      />
      <link rel="stylesheet" href="/hiffi-about/hiffi-about.css" />
      <link rel="stylesheet" href="/hiffi-about/flip.css" />
      <div className={poppins.className}>{children}</div>
      <AboutSiteFooter />
    </>
  );
}
