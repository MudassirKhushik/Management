import { Providers } from "../components/Provider";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
        {children}
        </Providers>
        </body>
    </html>
  );
}
