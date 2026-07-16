export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 pb-safe pt-safe">
      {children}
    </main>
  );
}
