import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Restart docker compose',
  description: 'Idk why this happens just click the button',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="w-full min-h-screen danger-stripes">
        <div className="w-full min-h-screen danger-overlay">{children}</div>
      </body>
    </html>
  );
}
