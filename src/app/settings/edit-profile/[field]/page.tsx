import { notFound } from "next/navigation";
import { Roboto } from "next/font/google";
import EditProfileSettings, { type FieldKey } from "@/components/settings/EditProfileSettings";
import ProfileMediaEditor from "@/components/settings/ProfileMediaEditor";
import ProfileMedalEditor from "@/components/settings/ProfileMedalEditor";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });
const fields = ["username", "first_name", "last_name", "phone", "gender", "preferred_shirt_size", "residence", "cover", "avatar", "medals"];

export default async function EditProfileFieldPage({ params }: { params: Promise<{ field: string }> }) {
  const { field } = await params;
  if (!fields.includes(field)) notFound();
  return <div className={`${roboto.className} min-h-screen bg-[#070707] px-[15px] pb-20 text-white`}>
    {field === "medals" ? <ProfileMedalEditor /> : field === "cover" || field === "avatar" ? <ProfileMediaEditor kind={field} /> : <EditProfileSettings field={field as FieldKey} />}
  </div>;
}
