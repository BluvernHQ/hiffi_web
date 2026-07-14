import { Poppins } from "next/font/google";
import "./hiffi-about.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/hiffi-about/hiffi-about.css" />
      <link rel="stylesheet" href="/hiffi-about/flip.css" />
      <div className={poppins.className}>{children}</div>
    </>
  );
}
