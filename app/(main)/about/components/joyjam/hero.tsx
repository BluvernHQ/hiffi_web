import CircleSlider from "./circle-slider";

export default function JoyJamHero() {
  return (
    <section className="hero-sc">
      <div className="full-container hero-s">
        <CircleSlider />

        <div className="text-elements hero-s">
          <div className="headline-wrapper hero-s">
            <h1 className="headline-h1">
              Music&apos;s <br />
              Social Media
            </h1>
          </div>
          <div className="description-wrapper hero-s">
            <p className="subheadline-m">Built for Creators. Powered by Fans.</p>
          </div>
          <div className="app-buttons">
            <div className="app-button-wrapper beta">
              <a aria-label="Join the Beta" href="#" className="app-button join-s w-inline-block">
                <div>Join the Beta</div>
                <div className="app-button-circles">
                  <div className="hover-circle-s1" />
                  <div className="hover-circle-s2" />
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="hero-mask" />
      </div>
    </section>
  );
}
