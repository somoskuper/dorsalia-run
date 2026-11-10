import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#070707] px-[15px] pb-16 text-center text-white">
      <p className="text-[64px] font-semibold leading-none">404</p>
      <h1 className="mt-4 text-[24px] font-semibold leading-7">No encontramos esta página</h1>
      <p className="mt-[10px] max-w-sm text-[16px] leading-6 text-white/50">La dirección no existe o ya no está disponible.</p>
      <Link href="/" className="mt-[30px] inline-flex h-[52px] items-center rounded-full bg-[#C5E500] px-6 text-[16px] font-bold" style={{ color: "#070707" }}>Volver al inicio</Link>
    </div>
  );
}
