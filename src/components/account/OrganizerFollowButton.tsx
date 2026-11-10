"use client";
import { useEffect, useState } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { askForAccount } from "@/components/account/AccountPrompt";
import { createClient } from "@/lib/supabase/client";

export default function OrganizerFollowButton({workspaceId, slug}: {workspaceId:string; slug:string}) {
  const {user} = useAthleteAuth();
  const [stats,setStats] = useState({followers:0,is_following:false});
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  useEffect(() => {
    let active=true;
    void createClient().rpc("organizer_follow_stats",{p_workspace_id:workspaceId}).then(({data})=>{if(active&&data)setStats(data);});
    return ()=>{active=false;};
  },[workspaceId,user?.id]);
  async function toggle(){
    if(!user){askForAccount("seguir a este organizador", `/org/${slug}`);return;}
    setBusy(true);setError("");
    try {
      const {data,error}=await createClient().rpc("toggle_organizer_follow",{p_workspace_id:workspaceId});
      if(error)throw error;
      setStats(data);
    } catch {setError("No se pudo actualizar. Intenta de nuevo.");}
    finally{setBusy(false);}
  }
  return <div className="mt-5"><div className="flex flex-wrap items-center gap-4"><button type="button" disabled={busy} onClick={()=>void toggle()} className={stats.is_following?"rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white":"rounded-full bg-[#c9f24b] px-5 py-2.5 text-sm font-bold text-black"}>{busy?"…":stats.is_following?"Siguiendo":"Seguir"}</button><span className="text-sm text-white/55"><strong className="text-white">{stats.followers}</strong> seguidores</span></div>{error?<p role="alert" className="mt-2 text-sm text-red-300">{error}</p>:null}</div>;
}
