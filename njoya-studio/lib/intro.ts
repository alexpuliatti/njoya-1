export const INTRO_SESSION_KEY = "njoya-intro-artwork-2026-v1";

// Runs before hydration so returning visitors never see a flash of the intro.
export const INTRO_BOOTSTRAP = `(()=>{let skip=matchMedia('(prefers-reduced-motion: reduce)').matches;try{skip=skip||sessionStorage.getItem('${INTRO_SESSION_KEY}')==='true'}catch{}document.documentElement.dataset.njoyaIntro=skip?'skip':'show'})()`;
