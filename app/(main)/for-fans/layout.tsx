import { Poppins } from "next/font/google";
import AboutSiteFooter from "../about/components/hiffi-about/about-site-footer";
import "../about/hiffi-about.css";
import "../about/hiffi-promo-cards.css";
import "./for-fans.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export default function ForFansLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html:
            "html{font-size:1vw;font-size:1svw}.ff-page{opacity:0!important}html.w-mod-js .ff-page{opacity:1!important}",
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add("joyjam-rem-scale");document.documentElement.style.fontSize="1svw"`,
        }}
      />
      <link rel="stylesheet" href="/hiffi-about/hiffi-about.css" />
      <link rel="stylesheet" href="/hiffi-about/flip.css" />
      <div className={poppins.className}>{children}</div>
      <AboutSiteFooter />
    </>
  );
}
