import { hiffiAboutAsset, slideAsset } from "./assets";

const ARTIST_IMAGES = {
  s1: "/hiffi-about/artst1.webp",
  s4: "/artist3.jpeg",
  s6: "/artist2.jpeg",
  s8: "/artist4.jpeg",
  s3: "/artist5.jpeg",
} as const;

function AssetImg({
  file,
  alt = "",
  className = "image-contain",
  cover = false,
}: {
  file: string;
  alt?: string;
  className?: string;
  cover?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={slideAsset(file)}
      alt={alt}
      loading="lazy"
      className={cover ? "image-cover" : className}
    />
  );
}

function ArtistPortrait({ variant }: { variant: keyof typeof ARTIST_IMAGES }) {
  return (
    <div className={`flip-photo-frame flip-artist-portrait ${variant}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ARTIST_IMAGES[variant]} alt="" loading="lazy" className="image-cover" />
    </div>
  );
}

export function FlipSlideContent({ variant }: { variant: string }) {
  switch (variant) {
    case "s1":
      return (
        <>
          <div className="flip-widget-point card-1-s1">
            <div className="flip-fire-sticker">
              <div>🔥</div>
            </div>
          </div>
          <div className="flip-widget-point card-1-s2">
            <div className="flip-pop-message card-1-s1">
              <AssetImg file="6821a59ae3bfe300713424c3_d08ce3661a205725180d474b3cd53898_flip-pop-1.png" />
            </div>
          </div>
          <div className="flip-widget-point card-1-s3">
            <div className="flip-pop-message card-1-s2">
              <AssetImg file="6821a59ae3bfe300713424c2_b6c2aea695bd15b96e4bfaf6535e2479_flip-pop-2.png" />
            </div>
          </div>
        </>
      );
    case "s2":
      return (
        <>
          <div className="flip-widget-point card-2-s1">
            <div className="flip-crystal-block">
              <div>💎</div>
            </div>
          </div>
          <div className="flip-widget-point card-2-s2">
            <div className="flip-photo-frame">
              <AssetImg file="6821a59ae3bfe300713424ff_270d353c332d5615b1c2d040bdf8f7fe_flip-photo-3.webp" />
            </div>
          </div>
          <div className="flip-widget-point card-2-s3">
            <div className="flip-photo-frame">
              <AssetImg file="6821a59ae3bfe300713424e3_flip-photo-1.avif" />
            </div>
          </div>
          <div className="flip-widget-point card-2-s4">
            <div className="flip-photo-frame">
              <AssetImg file="6821a59ae3bfe300713424db_11d838b647835e6b3c12294337653f17_flip-photo-2.webp" />
            </div>
          </div>
          <div className="flip-widget-point card-2-s5">
            <div className="flip-music-note">
              <AssetImg file="6821a59ae3bfe300713424d6_2ec800d5c5c6818499e1d1a337f4349c_music-note.webp" />
            </div>
          </div>
        </>
      );
    case "s3":
      return (
        <>
          <div className="flip-widget-point card-3-s1">
            <div className="flip-photo-frame card-3-scale">
              <AssetImg file="6821a59ae3bfe300713424fe_97b2808e474197a06a42f51a963ac0d8_flip-photo-5.webp" cover />
            </div>
          </div>
          <div className="flip-widget-point card-3-s2">
            <div className="flip-photo-frame card-3-scale">
              <AssetImg file="6821a59ae3bfe300713424e0_a42bd0651b7aae6553bc021a365d96b6_flip-card-bg-3.webp" cover />
            </div>
          </div>
          <div className="flip-widget-point card-3-s3">
            <div className="flip-total-views">
              <AssetImg file="6821a59ae3bfe300713424d3_fc98d38aff4dffc8afd94f42c1eab9f5_total-view.png" />
            </div>
          </div>
        </>
      );
    case "s4":
      return (
        <>
          <div className="flip-card-bg card-4">
            <ArtistPortrait variant="s4" />
          </div>
          <div className="flip-widget-point card-4-s1">
            <div className="flip-pop-message card-3-s1">
              <AssetImg file="6821a59ae3bfe300713424dd_750b966be6242b87fdf33a12295a6f44_flip-pop-4.png" />
            </div>
          </div>
          <div className="flip-widget-point card-4-s2">
            <div className="flip-pop-message card-3-s2">
              <AssetImg file="6821a59ae3bfe300713424d8_24e3a162301510f41ea1c4c884099164_flip-pop-3.png" />
            </div>
          </div>
          <div className="flip-widget-point card-4-s3">
            <div className="flip-heart">
              <AssetImg file="6821a59ae3bfe300713424c4_f5d273eae9e37c73ea577bd11e67be74_flip-heart.png" />
            </div>
          </div>
        </>
      );
    case "s5":
      return (
        <>
          <div className="flip-widget-point card-5-s1">
            <div className="flip-photo-frame card-5-scale">
              <AssetImg file="6821a59ae3bfe30071342501_0abe272ccc3bee7c32f139ad55a07a3e_flip-photo-6.webp" />
            </div>
          </div>
          <div className="flip-widget-point card-5-s2">
            <div className="flip-photo-frame card-5-scale">
              <AssetImg file="6821a59ae3bfe300713424f8_0595602631a22acfbdd31167bfef734c_flip-photo-7.webp" />
            </div>
          </div>
          <div className="flip-widget-point card-5-s3">
            <div className="flip-photo-frame card-5-scale">
              <AssetImg file="6821a59ae3bfe30071342518_44feb5258812cc31404ce7273d7cb933_flip-photo-8.webp" />
            </div>
          </div>
        </>
      );
    case "s6":
      return (
        <>
          <div className="flip-card-bg card-6">
            <ArtistPortrait variant="s6" />
          </div>
          <div className="flip-widget-point card-6-s1">
            <div className="flip-pop-message card-6-s1">
              <AssetImg file="6821a59ae3bfe300713424dc_fc21ddd00bd49dc6b4190a23a3088d9f_flip-pop-5.png" />
            </div>
          </div>
          <div className="flip-widget-point card-6-s2">
            <div className="flip-creator-badge">
              <AssetImg file="6821a59ae3bfe30071342505_93cccebfba4ae808a28c6abf32eafad3_creator-badge.png" />
            </div>
          </div>
          <div className="flip-widget-point card-6-s3">
            <div className="flip-silver-heart">
              <AssetImg file="6821a59ae3bfe300713424fa_452489448372a2b52dca22c327350682_silver-heart.png" />
            </div>
          </div>
        </>
      );
    case "s7":
      return (
        <>
          <div className="flip-widget-point card-7-s1">
            <div className="flip-sound-icon">
              <AssetImg file="6821a59ae3bfe300713424d7_6beadf83eca9123c8921b9f7e166dce0_flip-sound.png" />
            </div>
          </div>
          <div className="flip-widget-point card-7-s2">
            <div className="flip-pin-point s1">
              <AssetImg file="6821a59ae3bfe30071342506_e0c30de2532df02a4ad8245e76135b32_flip-pin-point-5.png" />
            </div>
          </div>
          <div className="flip-widget-point card-7-s3">
            <div className="flip-pin-point s2">
              <AssetImg file="6821a59ae3bfe30071342508_123298ddd3fe4fa5ab38cc015fdd88a9_flip-pin-point-1.png" />
            </div>
          </div>
          <div className="flip-widget-point card-7-s4">
            <div className="flip-pin-point s3">
              <AssetImg file="6821a59ae3bfe30071342504_ff53200cb5c9c9e4470fb35c98db0c98_flip-pin-point-4.png" />
            </div>
          </div>
          <div className="flip-widget-point card-7-s5">
            <div className="flip-pin-point s4">
              <AssetImg file="6821a59ae3bfe300713424de_e620baf98c1ccae05a0feeda5f8affd7_flip-pin-point-2.png" />
            </div>
          </div>
          <div className="flip-widget-point card-7-s6">
            <div className="flip-pin-point s5">
              <AssetImg file="6821a59ae3bfe300713424fb_aae41ee859311f36740bbfb4f9bfa473_flip-pin-point-3.png" />
            </div>
          </div>
        </>
      );
    case "s8":
      return (
        <>
          <div className="flip-widget-point card-8-s1">
            <div className="flip-photo-frame card-8-scale">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ARTIST_IMAGES.s8} alt="" loading="lazy" className="image-cover" />
            </div>
          </div>
          <div className="flip-widget-point card-8-s2">
            <div className="flip-photo-frame card-8-scale">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ARTIST_IMAGES.s8} alt="" loading="lazy" className="image-cover" />
            </div>
          </div>
          <div className="flip-widget-point card-8-s3">
            <div className="flip-headphones">
              <AssetImg file="6821a59ae3bfe300713424fc_5cca5f9d77cba5e173a785cbf8553c76_flip-headphones.png" />
            </div>
          </div>
          <div className="flip-widget-point card-8-s4">
            <div className="flip-ball">
              <AssetImg file="6821a59ae3bfe30071342500_651febcf4101ccc3fcf887b832ce07bd_flip-ball.webp" />
            </div>
          </div>
        </>
      );
    default:
      return null;
  }
}
