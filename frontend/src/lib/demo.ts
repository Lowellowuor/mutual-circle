// Demo mode: while the platform is a demo, the requester one-time code is
// shown on screen and pre-filled, because no real SMS OTP is sent yet.
// Controlled by VITE_DEMO_MODE at build time. ON unless set to "false".
export const DEMO_MODE: boolean =
  String(import.meta.env.VITE_DEMO_MODE ?? 'true').toLowerCase() !== 'false';