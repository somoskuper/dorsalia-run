export default function RutasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-black text-white overflow-hidden">
      {children}
    </div>
  );
}
