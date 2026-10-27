import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ticketlagbe.app",
  appName: "TicketLagbe",
  webDir: "www",
  backgroundColor: "#1A1C43",
  server: {
    url:
      process.env.CAPACITOR_SERVER_URL ||
      "https://ticketlagbe-marketplace-psi.vercel.app",
    cleartext: false,
    errorPath: "offline.html",
  },
};

export default config;
