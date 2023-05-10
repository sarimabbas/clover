import "./globals.css";
export const metadata = {
  title: "Cardboard",
  description: "React component for embedding rich media",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="container mx-auto p-4">{children}</body>
    </html>
  );
}
