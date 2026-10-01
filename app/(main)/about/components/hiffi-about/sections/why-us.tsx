"use client";

import { useHiffiAboutSectionInit } from "../use-hiffi-about-section-init";

export default function HiffiAboutWhyUs() {
  const ref = useHiffiAboutSectionInit("why-us-sc");

  return (
    <section ref={ref} className="why-us-sc">
      <div className="container why-us-s"><div className="text-elements why-us-s"><div className="headline-wrapper why-us-s"><h2 {...{ "data-split": "chars-blur" }} className="headline-h2">Why Hiffi Exists</h2></div><div className="description-wrapper why-us-s"><p {...{ "data-split": "lines-blur" }} className="body-regular-l">Hiffi was created with a simple belief: artists deserve a platform that puts creativity and community first. We champion hip-hop by showcasing talent based on artistry, not popularity metrics alone.</p></div></div><div className="why-us-cards"><div className="pair-cards why-us-s"><div className="pair-card-view s1"><div className="why-us-card s1"><div {...{ "scroll-scale": "1" }} className="why-us-trail-area"><div className="why-us-trail-flex down"><div className="why-us-trail move-down"><div className="why-us-taril-cards"><div className="why-us-taril-card"><img src="/hiffi-about/anthony-persegol-gVRzMmwRk7o.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/mike-von-3AX9brXEk6A.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/kristaps-solims-4LUNELVwnUk.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/6821a59ae3bfe30071342576_8b76b1bd28690762bb1df075ebe719ed_why-us-slide-2.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/anthony-persegol-gVRzMmwRk7o.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/mike-von-3AX9brXEk6A.webp" loading="lazy" alt="" className="image-cover"/></div></div></div></div><div className="why-us-trail-flex"><div className="why-us-trail move-up"><div className="why-us-taril-cards"><div className="why-us-taril-card"><img src="/hiffi-about/artist1.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/kristaps-solims-4LUNELVwnUk.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/6821a59ae3bfe30071342576_8b76b1bd28690762bb1df075ebe719ed_why-us-slide-2.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/6821a59ae3bfe30071342573_f4a7b655308f6083273679bc144ce246_why-us-slide-9.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/artist1.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/kristaps-solims-4LUNELVwnUk.webp" loading="lazy" alt="" className="image-cover"/></div></div></div></div><div className="why-us-trail-flex down"><div className="why-us-trail move-down"><div className="why-us-taril-cards"><div className="why-us-taril-card"><img src="/hiffi-about/karsten-winegeart-LFWIxEGvwiE-unsplash.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/6821a59ae3bfe30071342564_685cc5c7348a68c4c94ff4ba1caa310f_why-us-slide-8.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/mike-von-3AX9brXEk6A.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/kristaps-solims-4LUNELVwnUk.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/karsten-winegeart-LFWIxEGvwiE-unsplash.webp" loading="lazy" alt="" className="image-cover"/></div><div className="why-us-taril-card"><img src="/hiffi-about/6821a59ae3bfe30071342564_685cc5c7348a68c4c94ff4ba1caa310f_why-us-slide-8.webp" loading="lazy" alt="" className="image-cover"/></div></div></div></div><div className="why-us-move-css w-embed"><style dangerouslySetInnerHTML={{ __html: `.why-us-trail.move-up {
  animation: moveUp 40s linear infinite;
}

.why-us-trail.move-down {
  animation: moveDown 40s linear infinite;
}

@keyframes moveUp {
  0% {
    transform: translateY(0);
  }
  100% { 
    transform: translateY(-68%);  
  }
}

@keyframes moveDown {
  0% {
    transform: translateY(0);
  }
  100% { 
    transform: translateY(68%);  
  }
}` }} /></div></div><div className="why-us-inner-shadow"></div></div></div>
        <div className="pair-card-view s2">
          <div className="why-us-card s2">
            <img
              src="/hiffi_logo.webp"
              alt="Hiffi"
              width={739}
              height={1024}
              className="why-us-card-logo"
              loading="lazy"
            />
          </div>
        </div>
      </div>
      </div>
      </div>
    </section>
  );
}
