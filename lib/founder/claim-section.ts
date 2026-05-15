export const CREATE_CLAIM_SECTION_ID = "create-claimed-listing";

export function scrollToCreateClaimSection() {
  const section = document.getElementById(CREATE_CLAIM_SECTION_ID);
  if (!section) {
    return;
  }

  section.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${CREATE_CLAIM_SECTION_ID}`);
}
