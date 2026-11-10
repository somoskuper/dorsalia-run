type Props = {
  label?: string;
  iconSrc?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export default function PhotoUploadBar({ label = "Subir fotos", iconSrc = "/settings-icons/newgalery.svg", disabled = false, onClick }: Props) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex w-full flex-col items-center gap-0 rounded-[20px] bg-[#191919] py-[20px] leading-none disabled:opacity-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconSrc} alt="" width={34} height={34} className="h-[34px] w-[34px]" />
      <span className="text-[13px] font-normal leading-none text-white/50">{label}</span>
    </button>
  );
}
