import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

export const fontSans = GeistSans;
export const fontMono = GeistMono;

/** CSS variables for Geist Sans + Geist Mono (no third face). */
export const fontVariables = `${fontSans.variable} ${fontMono.variable}`;
