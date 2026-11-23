import type { Metadata } from "next";
import "./globals.css";
import "./readability.css";
import "./strategy.css";
import "./tutor-chats.css";
import "./personal.css";
export const metadata: Metadata = {
  title: "IELTS Sprint 30 — A little progress. Every day.",
  description:
    "Your focused 30-day IELTS Academic study companion. Practise, reflect, and build your confidence with real learning evidence.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="site-credit">
          made with Love ❤️ built by H.P.T
        </footer>
      </body>
    </html>
  );
}
