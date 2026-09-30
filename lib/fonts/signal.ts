import localFont from "next/font/local"

/** Hiffi 500 display face (Nimbus Sans Narrow), shared with the static chart. */
export const signalNarrow = localFont({
  src: [
    {
      path: "../../public/top-artists/assets/fonts/NimbusSansNarrow-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/top-artists/assets/fonts/NimbusSansNarrow-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-signal",
  display: "swap",
  fallback: ["Arial Narrow", "Helvetica Neue", "sans-serif"],
})
