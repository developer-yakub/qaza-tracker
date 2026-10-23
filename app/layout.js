import AuthGate from "@/components/AuthGate";
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Qaza Namaz Tracker",
  description: "Track your Qaza Fard prayers and Witr progress.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}