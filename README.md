# EU Interpreting — Prototype V1

A real WebRTC proof of concept for **human-only** interpretation distribution. The project includes a listener interface, a microphone-based interpreter publisher, and a microphone-based FLOOR publisher. The server issues LiveKit tokens.

## Start

1. Create a LiveKit Cloud project.
2. Copy `.env.example` to `.env.local` and fill the credentials and a strong `DEMO_ADMIN_KEY`.
3. Run `npm install` and `npm run dev`.
4. Open `http://localhost:3000` in two browser tabs or on two devices using a deployed HTTPS URL.
5. Join the same room as FLOOR (operator key required) and as a listener. Select FLOOR on the listener and activate playback if needed.
6. Add an interpreter on another device, with a language other than FLOOR. The listener can switch to that language.

## Important limitations

- This is an experimental demo, **not production-ready**.
- Language presence is inferred from subscribed audio tracks, not a central session registry. A language may appear unavailable until a track is subscribed.
- The interpreter interface does not yet provide a separate FLOOR/relay monitoring bus. For a real interpretation test, provide independent FLOOR monitoring through a headset/mixer; avoid speaker feedback.
- No conference-system connector is bundled. For the professional input path, use an OS-recognized audio capture device, then publish via the FLOOR role. Multi-channel ingest and mapping remain to be implemented.
- Publishing is protected only by a shared demo operator key; no user accounts, audit logs, session access control, abuse prevention, or single-publisher arbitration yet.
- The participant token can subscribe to all audio channels; the client selects one for playback. This is not selective server-side subscription.
- LiveKit room names are shared demo identifiers. Use unpredictable room names and appropriate access control for private events.
- For iPhone testing, deploy over HTTPS. Browsers may require a user gesture before audio playback.
- No validated latency or scale benchmarks are claimed.

## Next milestones

1. Add separate FLOOR/relay monitoring and interpreter microphone output.
2. Add channel assignment and collision prevention.
3. Add professional multi-channel ingest gateway (Dante/AES67/USB/analog capture as applicable).
4. Add room lifecycle, admin dashboard, security, telemetry, resilience and load testing.
