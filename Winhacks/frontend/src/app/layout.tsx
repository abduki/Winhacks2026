import "./globals.css";

export const metadata = {
  title: "TrackrBud",
  description: "Finance tracking for budgets, insights, and leaderboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
 