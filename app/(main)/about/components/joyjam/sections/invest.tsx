"use client";

import { useJoyJamSectionInit } from "../use-joyjam-section-init";

export default function JoyJamInvest() {
  const ref = useJoyJamSectionInit("invest-sc");

  return (
    <section ref={ref} className="invest-sc">
      <div className="container invest-s"><div className="invest-top-block"><div className="text-elements"><div className="headline-wrapper invest-top-s"><p className="headline-h5">More than a streaming platform</p><h2 {...{ "view-text-delay": "40" }} {...{ "create-spans": "" }} {...{ "view-text": "true" }} className="headline-h2">Our Vision.</h2></div></div><div {...{ "data-w-id": "edb03896-9274-0d31-e4cb-bb1fc253b533" }} className="invest-avatars"><div {...{ "data-w-id": "ea6c260a-d1b0-a9f8-0594-27b897e83b53" }}  className="invest-avatar"><img src="/joyjam/6821a59ae3bfe3007134255b_invest-avatar.avif" loading="lazy" alt="" className="image-cover"/></div><div {...{ "data-w-id": "00db128c-b411-7dca-062e-12f7d171a24d" }}  className="invest-avatar s2"><img src="/hiffi_logo.png" loading="lazy" alt="Hiffi" className="image-cover"/></div></div><div className="text-elements"><div className="description-wrapper invest-top-s"><p {...{ "view-text-margin": "20" }} {...{ "create-body-spans": "" }} {...{ "view-text": "true" }} {...{ "view-text-class": "body-line-span" }} className="body-regular-l">Hiffi aims to become the home artists and fans have been waiting for. More than a streaming service, we&apos;re building a community where creators can grow, listeners can discover new music, and hip-hop culture can thrive without gatekeepers.</p><div className="invest-descript-blur"></div></div></div></div><div className="invest-down-block"><div className="text-elements invest-down-s"><div className="headline-wrapper invest-down-s"><p className="invest-d-headline"><span className="gradient-span">Built for you.</span><br/>Artists, producers, DJs, and fans.</p></div><div {...{ "jelly-hover-parent": "" }} {...{ "view-item": "from-center" }} {...{ "data-wf--main-button--variant": "m" }} className="main-button-wrapper"><a {...{ "jelly-hover": "" }} {...{ "wave-parent-infinity": "" }} aria-label="Join Hiffi" href="/signup" className="main-button w-inline-block"><div>Join Hiffi</div><div aria-hidden="true" className="wave-area"><div {...{ "data-expand": "1.5" }} className="wave-line-infinity"></div><div {...{ "data-expand": "1.5" }} className="wave-line-infinity"></div></div></a></div></div></div><div className="invest-bg"></div></div>
    </section>
  );
}
