import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-24">
      <div className="mx-auto max-w-lg">{children}</div>
      <BottomNav />
    </div>
  );
}
