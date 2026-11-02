// A fresh document always opens with the artwork. The client marks it as seen
// for subsequent navigation within that document, without persisting across reloads.
export const INTRO_BOOTSTRAP = `document.documentElement.dataset.njoyaIntro='show'`;
