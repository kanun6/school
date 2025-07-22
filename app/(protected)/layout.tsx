export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is simple, it just renders the children without any extra chrome
  return <main>{children}</main>;
}