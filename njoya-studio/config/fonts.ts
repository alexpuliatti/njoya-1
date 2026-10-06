import localFont from "next/font/local";

export const fontSans = localFont({
  src: "../assets/fonts/inter-latin-variable.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 900",
});
