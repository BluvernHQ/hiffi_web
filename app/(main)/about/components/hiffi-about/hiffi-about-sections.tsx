import HiffiAboutBenefits from "./benefits";
import HiffiAboutCta from "./sections/cta";
import HiffiAboutCreators from "./sections/creators";
import HiffiAboutFansBenefits from "./sections/fans-benefits";
import HiffiAboutInvest from "./sections/invest";
import HiffiAboutReviews from "./sections/reviews";
import HiffiAboutWhyUs from "./sections/why-us";

export default function HiffiAboutSections() {
  return (
    <>
      <HiffiAboutBenefits />
      <HiffiAboutCreators />
      <HiffiAboutFansBenefits />
      <HiffiAboutCta />
      <HiffiAboutWhyUs />
      <HiffiAboutInvest />
      <HiffiAboutReviews />
    </>
  );
}
