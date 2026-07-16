import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-session";
import { Header } from "@/components/shell/Header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-3xl px-4 pb-safe pt-safe">
      <Header userName={session.user.name} />
      {children}
    </div>
  );
}
