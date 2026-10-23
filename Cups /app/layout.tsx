import type { Metadata } from "next";
import "./studio.css";
import "./cups.css";
import "./designer.css";
import "./premium.css";
export const metadata: Metadata = { title: "Custom Cup Studio", description: "Branded packaging concepts for modern businesses." };
export default function RootLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
    return <html lang="en"><body>{children}</body></html>;
}
