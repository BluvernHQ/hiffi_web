import { SearchClient } from "./search-client";

const SEARCH_INTRO_TITLE = "Search creators and videos on Hiffi";
const SEARCH_INTRO_DESCRIPTION =
  "Find independent artists, music videos, and creator profiles on Hiffi. Search by video title or use @username to discover creators. Hiffi is a high-fidelity streaming platform for independent artists worldwide.";

/** Crawler-visible intro — complements layout metadata for the client-rendered search UI. */
function SearchStaticIntro() {
  return (
    <div className="sr-only" aria-hidden="true">
      <h2>{SEARCH_INTRO_TITLE}</h2>
      <p>{SEARCH_INTRO_DESCRIPTION}</p>
    </div>
  );
}

function SearchNoscriptIntro() {
  return (
    <noscript>
      <h1>{SEARCH_INTRO_TITLE}</h1>
      <p>{SEARCH_INTRO_DESCRIPTION}</p>
    </noscript>
  );
}

export default function SearchPage() {
  return (
    <>
      <SearchStaticIntro />
      <SearchNoscriptIntro />
      <SearchClient />
    </>
  );
}
