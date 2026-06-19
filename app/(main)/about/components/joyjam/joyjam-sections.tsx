import JoyJamBenefits from "./benefits";
import JoyJamCta from "./sections/cta";
import JoyJamCreators from "./sections/creators";
import JoyJamFansBenefits from "./sections/fans-benefits";
import JoyJamFooter from "./sections/footer";
import JoyJamInvest from "./sections/invest";
import JoyJamReviews from "./sections/reviews";
import JoyJamWhyUs from "./sections/why-us";

export default function JoyJamSections() {
  return (
    <>
      <JoyJamBenefits />
      <JoyJamCreators />
      <JoyJamFansBenefits />
      <JoyJamCta />
      <JoyJamWhyUs />
      <JoyJamInvest />
      <JoyJamReviews />
      <JoyJamFooter />
    </>
  );
}
