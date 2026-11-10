import { highResolutionAvatar } from "@/lib/avatarImage";
import Link from "next/link";

type ProfileIdentityProps = {
  displayName: string;
  username?: string | null;
  avatarUrl: string | null;
  coverSrc: string;
  onAvatarClick?: () => void;
  readOnly?: boolean;
  editMode?: boolean;
  creatorType?: "photographer" | null;
  avatarOnly?: boolean;
};

export default function ProfileIdentity({
  displayName,
  username,
  avatarUrl,
  coverSrc,
  onAvatarClick,
  readOnly = false,
  editMode = false,
  creatorType = null,
  avatarOnly = false,
}: ProfileIdentityProps) {
  const initials = displayName.slice(0, 1).toUpperCase() || "A";

  return (
    <div className={avatarOnly ? "relative flex justify-center" : "relative flex flex-col items-center text-center"}>
      {avatarOnly ? null : (
        <>
      {/* The cover starts behind the 84px header and ends at the avatar's center. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={coverSrc} alt="" className="pointer-events-none absolute left-1/2 top-[-134px] h-[210.5px] w-screen max-w-none -translate-x-1/2 object-cover" />
      {editMode ? <Link href="/settings/edit-profile/cover" aria-label="Editar portada" className="absolute right-[15px] top-[-35px] z-10 grid h-9 w-9 place-items-center rounded-full bg-black/65">
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/profile-highlights/edit.svg" alt="" width={20} height={20} />
      </Link> : null}
        </>
      )}
      <div className="relative grid h-[153px] w-[153px] place-items-center rounded-[47px] border-4 border-[#C5E500]">
        <button
          type="button"
          onClick={readOnly ? undefined : onAvatarClick}
          disabled={readOnly || !onAvatarClick}
          aria-label={readOnly ? `Foto de ${displayName}` : "Cambiar foto de perfil"}
          className="h-[145px] w-[145px] overflow-hidden rounded-[43px] disabled:cursor-default"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={highResolutionAvatar(avatarUrl) || avatarUrl}
              alt=""
              width={145}
              height={145}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center bg-neutral-800 font-akira text-4xl text-white">
              {initials}
            </span>
          )}
        </button>
        {editMode ? <Link href="/settings/edit-profile/avatar" aria-label="Editar foto de perfil" className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-full bg-[#191919] ring-2 ring-[#070707]">
          {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/profile-highlights/edit.svg" alt="" width={20} height={20} />
        </Link> : null}
        {creatorType === "photographer" && !editMode ? <span className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-xl bg-[#C5E500] ring-2 ring-[#070707]" aria-label="Fotógrafo en Dorsalia" title="Fotógrafo en Dorsalia">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/settings-icons/creador-verificado.svg" alt="" width={20} height={20} /></span> : null}
      </div>
      {avatarOnly ? null : (
        <>
      <h1 className="relative mt-[10px] max-w-full break-words text-[32px] font-bold leading-tight text-white [overflow-wrap:anywhere]">
        {displayName}
      </h1>
      {username ? <p className="relative mt-[2px] text-[16px] font-medium text-white/50">@{username}</p> : null}
        </>
      )}
    </div>
  );
}
