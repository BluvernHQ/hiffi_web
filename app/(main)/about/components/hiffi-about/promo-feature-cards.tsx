/** Figma promo cards — real markup (text + icons + art only) */

import {
  BarChart3,
  Bell,
  Flame,
  Headphones,
  LayoutList,
  Mail,
  MessageCircle,
  MessageCircleHeart,
  Mic,
  ShieldCheck,
  Star,
  TriangleAlert,
  Upload,
  Users,
} from "lucide-react";

export function DiscoveryPromoCards() {
  return (
    <>
      <article className="hj-card hj-card--red hj-card--discover">
        <p className="hj-card-eyebrow">Tools That</p>
        <h3 className="hj-card-title hj-card-title--lg">
          Power Hip Hop
          <br />
          Artists
        </h3>
        <p className="hj-card-body">
          Create, share, and grow your music with a platform built exclusively for hip hop and rap
          artists.
        </p>
        <div className="hj-card-bottom">
          <img
            className="hj-card-brand"
            src="/appbarlogo.png"
            alt="Hiffi"
            width={132}
            height={32}
          />
          <div className="hj-card-pills">
            <span className="hj-card-pill">Upload</span>
            <span className="hj-card-pill">Connect</span>
          </div>
          <p className="hj-card-foot">
            Upload your music, connect with fans, and build your community in one dedicated
            platform.
          </p>
        </div>
      </article>

      <article className="hj-card hj-card--gray hj-card--mock hj-card--discover-mid">
        <h3 className="hj-card-title">Content Creation</h3>
        <p className="hj-card-sub hj-card-sub--tight">Showcase your content, your way</p>
        <div className="hj-mock-panel">
          <div className="hj-mock-dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <span className="hj-mock-badge">Stories</span>
          <img
            className="hj-mock-phone hj-mock-phone--studio"
            src="/for-creators/discovery/phone-studio-top.png"
            alt=""
            width={238}
            height={233}
          />
        </div>
      </article>

      <article className="hj-card hj-card--grow hj-card--mock hj-card--discover-end">
        <h3 className="hj-card-title">Music That Matches You</h3>
        <p className="hj-card-sub hj-card-sub--tight">
          Personalized recommendations help you discover artists, tracks, and videos that fit your
          unique taste in hip hop and rap.
        </p>
        <div className="hj-mock-feed">
          <img
            className="hj-mock-phone hj-mock-phone--feed"
            src="/for-creators/discovery/phone-feed-top.png"
            alt=""
            width={314}
            height={308}
          />
        </div>
      </article>
    </>
  );
}

export function CreationPromoCards() {
  return (
    <>
      <article className="hj-card hj-card--red hj-card--create">
        <p className="hj-card-eyebrow">Built for</p>
        <h3 className="hj-card-title hj-card-title--lg">
          Hip Hop
          <br />
          Creators
        </h3>
        <ul className="hj-card-list">
          <li>
            <Upload className="hj-card-ico" strokeWidth={2.25} aria-hidden />
            Upload Your Music
          </li>
          <li>
            <BarChart3 className="hj-card-ico" strokeWidth={2.25} aria-hidden />
            Release New Videos
          </li>
          <li>
            <LayoutList className="hj-card-ico" strokeWidth={2.25} aria-hidden />
            Track Your Growth
          </li>
        </ul>
        <p className="hj-card-foot">
          Create, share, and connect with fans through a platform built for music communities.
        </p>
      </article>

      <article className="hj-card hj-card--gray hj-card--create">
        <h3 className="hj-card-title">
          Everything You Need
          <br />
          to Create
        </h3>
        <p className="hj-card-sub">
          Powerful tools to upload, edit, and manage your content effortlessly.
        </p>
        <div className="hj-card-art-wrap">
          <img
            className="hj-card-art"
            src="/for-creators/cards/clapper.png"
            alt=""
            width={185}
            height={212}
          />
        </div>
      </article>

      <article className="hj-card hj-card--grow hj-card--create">
        <h3 className="hj-card-title">
          See Your Growth
          <br />
          Stay Inspired
        </h3>
        <p className="hj-card-sub">
          Track your performance, understand your audience, and keep improving.
        </p>
        <div className="hj-card-art-wrap">
          <img
            className="hj-card-art hj-card-art--chart"
            src="/for-creators/cards/chart.png"
            alt=""
            width={199}
            height={212}
          />
        </div>
      </article>
    </>
  );
}

/** For Fans — Discover row (Figma 171:112) */
export function FansDiscoverPromoCards() {
  return (
    <>
      <article className="hj-card hj-card--red hj-card--ff-disc">
        <p className="hj-card-eyebrow">Built for</p>
        <h3 className="hj-card-title hj-card-title--lg">
          Hip Hop
          <br />
          Fans
        </h3>
        <ul className="hj-card-list">
          <li>
            <Flame className="hj-card-ico" strokeWidth={2.25} aria-hidden />
            Discover New Music
          </li>
          <li>
            <Mic className="hj-card-ico" strokeWidth={2.25} aria-hidden />
            Support Independent Artists
          </li>
          <li>
            <LayoutList className="hj-card-ico" strokeWidth={2.25} aria-hidden />
            Stay Ahead of New Releases
          </li>
        </ul>
        <p className="hj-card-foot">
          Create, share, and connect with fans through a platform built for music communities.
        </p>
      </article>

      <article className="hj-card hj-card--gray hj-card--mock hj-card--ff-disc-mid">
        <h3 className="hj-card-title">Discover Your Next Favorite Artist</h3>
        <p className="hj-card-sub hj-card-sub--tight">
          Explore fresh hip hop and rap music from rising creators around the world
        </p>
        <div className="hj-mock-panel">
          <div className="hj-mock-dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <span className="hj-mock-badge">Stories</span>
          <img
            className="hj-mock-phone hj-mock-phone--studio"
            src="/for-fans/discovery/phone-stories.png"
            alt=""
            width={225}
            height={215}
          />
        </div>
      </article>

      <article className="hj-card hj-card--grow hj-card--mock hj-card--ff-disc-end">
        <h3 className="hj-card-title">Discover Rising Artists</h3>
        <p className="hj-card-sub hj-card-sub--tight">
          Explore the next generation of hip hop and rap talent. Visit artist profiles, browse their
          latest releases, and follow their musical journey—all in one place.
        </p>
        <span className="hj-card-rule" aria-hidden />
        <div className="hj-mock-feed">
          <img
            className="hj-mock-phone hj-mock-phone--feed"
            src="/for-fans/discovery/phone-profile.png"
            alt=""
            width={286}
            height={283}
          />
        </div>
      </article>

      <article className="hj-card hj-card--ff-help">
        <p className="hj-card-eyebrow hj-card-eyebrow--red">Support</p>
        <h3 className="hj-card-title">We&apos;re Here For You</h3>
        <ul className="hj-help-list">
          <li>
            <span className="hj-help-bar" aria-hidden />
            <span>Help Center</span>
            <Headphones className="hj-help-ico" strokeWidth={2} aria-hidden />
          </li>
          <li>
            <span className="hj-help-bar" aria-hidden />
            <span>Contact Us</span>
            <Mail className="hj-help-ico" strokeWidth={2} aria-hidden />
          </li>
          <li>
            <span className="hj-help-bar" aria-hidden />
            <span>Report an Issue</span>
            <TriangleAlert className="hj-help-ico" strokeWidth={2} aria-hidden />
          </li>
          <li>
            <span className="hj-help-bar" aria-hidden />
            <span>Community Guidelines</span>
            <ShieldCheck className="hj-help-ico" strokeWidth={2} aria-hidden />
          </li>
        </ul>
      </article>
    </>
  );
}

/** For Fans — Connect row (Figma 148:96) */
export function FansConnectPromoCards() {
  return (
    <>
      <article className="hj-card hj-card--ink">
        <h3 className="hj-card-title">Watch &amp; Explore</h3>
        <p className="hj-card-sub hj-card-sub--tight">
          Dive into trending music videos and discover what&apos;s new in the HIFFI community.
        </p>
        <div className="hj-fan-stack" aria-hidden>
          <img className="hj-fan-tile s1" src="/for-fans/connect/watch-1.png" alt="" />
          <img className="hj-fan-tile s2" src="/for-fans/connect/watch-3.png" alt="" />
          <img className="hj-fan-tile s3" src="/for-fans/connect/watch-2.png" alt="" />
          <img className="hj-fan-play" src="/for-fans/connect/watch-play.svg" alt="" />
        </div>
      </article>

      <article className="hj-card hj-card--spotlight">
        <h3 className="hj-card-title">Creator Spotlight</h3>
        <p className="hj-card-sub hj-card-sub--tight">Meet creators shaping the culture.</p>
        <div className="hj-spot-thumbs" aria-hidden>
          <div className="hj-spot-thumb s1">
            <img src="/for-fans/connect/spot-1.png" alt="" />
            <img className="hj-spot-plus" src="/for-fans/connect/spot-plus.svg" alt="" />
          </div>
          <div className="hj-spot-thumb s2">
            <img src="/for-fans/connect/watch-2.png" alt="" />
            <img className="hj-spot-plus" src="/for-fans/connect/spot-plus.svg" alt="" />
          </div>
        </div>
      </article>

      <article className="hj-card hj-card--grow hj-card--mock hj-card--ff-conn-phone">
        <p className="hj-card-eyebrow">Connect</p>
        <h3 className="hj-card-title">Be Part of the Culture</h3>
        <p className="hj-card-sub hj-card-sub--tight">
          Connect with artists, fans, and creators.
          <br />
          Build real relationships that go beyond music.
        </p>
        <div className="hj-mock-feed">
          <img
            className="hj-mock-phone hj-mock-phone--feed"
            src="/for-fans/connect/phone-culture.png"
            alt=""
            width={295}
            height={269}
          />
        </div>
      </article>

      <article className="hj-card hj-card--gray hj-card--ff-crew">
        <h3 className="hj-card-title">Find Your Crew</h3>
        <p className="hj-card-sub hj-card-sub--tight">
          Connect with fans who share your taste, discover new artists together, and be part of
          conversations that keep hip-hop alive.
        </p>
        <div className="hj-crew-art" aria-hidden>
          <img className="hj-crew-ava a1" src="/for-fans/connect/crew-1.png" alt="" />
          <img className="hj-crew-ava a2" src="/for-fans/connect/crew-3.png" alt="" />
          <img className="hj-crew-ava a3" src="/for-fans/connect/crew-2.png" alt="" />
        </div>
        <ul className="hj-crew-list">
          <li>
            <Users className="hj-crew-mark" strokeWidth={2} aria-hidden />
            <span>
              <strong>Your People</strong>
              Find fans who get your vibe
            </span>
          </li>
          <li>
            <Users className="hj-crew-mark" strokeWidth={2} aria-hidden />
            <span>
              <strong>Discover Together</strong>
              Find new artists and fresh drops.
            </span>
          </li>
          <li>
            <Users className="hj-crew-mark" strokeWidth={2} aria-hidden />
            <span>
              <strong>Belong</strong>
              Be part of the culture.
            </span>
          </li>
        </ul>
      </article>
    </>
  );
}

export function CommunityPromoCards() {
  return (
    <>
      <article className="hj-card hj-card--community hj-card--comm">
        <p className="hj-card-eyebrow">Built for</p>
        <h3 className="hj-card-title hj-card-title--lg">
          Hip Hop
          <br />
          Community
        </h3>
        <ul className="hj-card-list">
          <li>
            <span className="hj-card-ico-badge">
              <Users strokeWidth={2.25} aria-hidden />
            </span>
            Connect &amp; Engage
          </li>
          <li>
            <span className="hj-card-ico-badge">
              <MessageCircleHeart strokeWidth={2.25} aria-hidden />
            </span>
            Support &amp; Celebrate
          </li>
          <li>
            <span className="hj-card-ico-badge hj-card-ico-badge--bell">
              <Bell strokeWidth={2.25} aria-hidden />
              <span className="hj-card-ico-badge-dot">1</span>
            </span>
            Stay in the Loop
          </li>
        </ul>
        <p className="hj-card-foot">
          Real people, real passion.
          <br />
          One community.
        </p>
      </article>

      <article className="hj-card hj-card--gray hj-card--comm">
        <p className="hj-card-eyebrow">Your Reach</p>
        <h3 className="hj-card-title">A community that grows with you</h3>
        <p className="hj-card-sub">
          Track how your fanbase is building and where the conversation is happening.
        </p>
        <ul className="hj-card-rows">
          <li className="hj-card-row-item">
            <span className="hj-card-row-ico" aria-hidden />
            <span className="hj-card-row-copy">
              <strong>Live cyphers</strong>
              <span>Freestyle together in real time</span>
            </span>
          </li>
          <li className="hj-card-row-item">
            <span className="hj-card-row-ico" aria-hidden />
            <span className="hj-card-row-copy">
              <strong>Fan clubs</strong>
              <span>Private spaces for your day-ones</span>
            </span>
          </li>
          <li className="hj-card-row-item">
            <span className="hj-card-row-ico" aria-hidden />
            <span className="hj-card-row-copy">
              <strong>Collab requests</strong>
              <span>Get discovered by other artists</span>
            </span>
          </li>
        </ul>
      </article>

      <article className="hj-card hj-card--comm hj-card--comm-end">
        <p className="hj-card-eyebrow">Stay Close</p>
        <h3 className="hj-card-title">Never miss a moment</h3>
        <p className="hj-card-sub">
          Simple ways to stay in the loop with the artists and fans you follow.
        </p>
        <ul className="hj-card-rows">
          <li className="hj-card-row-item hj-card-row-item--glass">
            <Bell className="hj-card-row-mark hj-card-row-mark--gold" strokeWidth={2} aria-hidden />
            <span className="hj-card-row-copy">
              <strong>Drop alerts</strong>
              <span>Know the moment new music lands</span>
            </span>
          </li>
          <li className="hj-card-row-item hj-card-row-item--glass">
            <MessageCircle className="hj-card-row-mark" strokeWidth={2} aria-hidden />
            <span className="hj-card-row-copy">
              <strong>Comments and shoutouts</strong>
              <span>Talk directly with the artist</span>
            </span>
          </li>
          <li className="hj-card-row-item hj-card-row-item--glass">
            <Star className="hj-card-row-mark" strokeWidth={2} aria-hidden />
            <span className="hj-card-row-copy">
              <strong>Founding fan badge</strong>
              <span>Get recognized for joining early</span>
            </span>
          </li>
        </ul>
      </article>
    </>
  );
}
