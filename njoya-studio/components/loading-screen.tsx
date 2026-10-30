'use client'

import dynamic from "next/dynamic";
import animationData from "../assets/njoya_loader_lottie.json";

/* Client-side only — lottie-web touches `document` on import. */
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function LoadingScreen() {

  return (
      <div className="h-full w-full flex bg-transparent items-center justify-center">
        <Lottie animationData={animationData} loop={true} autoplay={true} className="w-1/4 h-1/4" />
      </div>
  );
}
