// packages/ui/src/track.ts — re-export the canonical dataLayer push. หอมฉลุย — Powered by 2T9COME.
// The implementation lives in @homchalui/analytics (the event home, CLAUDE.md §4); UI components
// keep importing `track` from @homchalui/ui for convenience. Every event carries `locale` + the
// full envelope and is validated against packages/validators/tracking in development.
export { track, pushEvent, type GtmEvent } from "@homchalui/analytics";
