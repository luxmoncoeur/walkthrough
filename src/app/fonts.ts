import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

// Shared by the root layout and global-error (which renders its own <html>). Only the weights in use.
const sans = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["400", "500", "600"] });
// Mono is for code only (Shiki output and the home code sample).
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: "400" });

export const fontVariables = `${sans.variable} ${mono.variable}`;
