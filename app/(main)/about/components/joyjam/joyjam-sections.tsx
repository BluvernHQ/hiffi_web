import JoyJamHtmlSection from "./joyjam-html-section";

export default function JoyJamSections() {
  return (
    <>
      <JoyJamHtmlSection className="benefits-sc" htmlPath="/joyjam/sections/benefits-sc.html" />
      <JoyJamHtmlSection className="creators-sc" htmlPath="/joyjam/sections/creators-sc.html" />
      <JoyJamHtmlSection className="fans-benefits-sc" htmlPath="/joyjam/sections/fans-benefits-sc.html" />
      <JoyJamHtmlSection className="cta-sc" htmlPath="/joyjam/sections/cta-sc.html" />
      <JoyJamHtmlSection className="why-us-sc" htmlPath="/joyjam/sections/why-us-sc.html" />
      <JoyJamHtmlSection className="invest-sc" htmlPath="/joyjam/sections/invest-sc.html" />
      <JoyJamHtmlSection className="reviews-sc" htmlPath="/joyjam/sections/reviews-sc.html" />
      <JoyJamHtmlSection as="footer" className="footer" htmlPath="/joyjam/sections/footer.html" />
    </>
  );
}
