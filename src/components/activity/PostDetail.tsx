"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PostMenu from "@/components/activity/PostMenu";
import PostComments from "@/components/activity/PostComments";
import { ActivityPostArticle } from "@/components/activity/ActivityFeed";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { fetchActivityPost, type ActivityItem } from "@/lib/activity";
import { createClient } from "@/lib/supabase/client";
import { usePublicEventPaths } from "@/lib/usePublicEventPaths";
import { PostSkeleton } from "@/components/ui/Skeleton";

export default function PostDetail({ postId, fallbackHref = "/cuenta" }: { postId: string; fallbackHref?: string }) {
  const router = useRouter();
  const { user } = useAthleteAuth();
  const eventPaths = usePublicEventPaths();
  const [post, setPost] = useState<ActivityItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setPost(await fetchActivityPost(postId));
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    void load().catch(() => { if (active) setError("No se pudo abrir la publicación."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [postId]);

  async function removePost() {
    if (!post || !user || !window.confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) return;
    const supabase = createClient();
    const paths = post.photos.map((photo) => photo.storage_path).filter((path): path is string => Boolean(path));
    const result = post.post_type === "creator" && post.creator_publication_id
      ? await supabase.from("creator_publications").delete().eq("id", post.creator_publication_id).eq("creator_id", post.user_id)
      : post.post_type === "review" && post.review_id
      ? await supabase.from("event_reviews").delete().eq("id", post.review_id)
      : await supabase.from("activity_posts").delete().eq("id", post.id);
    if (result.error) { setError(result.error.message); return; }
    if (post.post_type === "creator") await supabase.from("activity_posts").delete().eq("id", post.id).eq("user_id", post.user_id);
    if (paths.length) await supabase.storage.from("public-image").remove(paths);
    router.push(post.post_type === "creator" ? "/creator/publications" : "/cuenta");
  }

  const action = post?.mine ? <PostMenu postId={post.id} onEdit={() => post.post_type === "creator" && post.creator_publication_id ? router.push(`/creator/new?edit=${post.creator_publication_id}`) : window.dispatchEvent(new CustomEvent("dorsalia:edit-post", { detail: post }))} onDelete={() => void removePost()} /> : undefined;

  return <div className="min-h-screen bg-[#070707] pb-24 text-white">
    <header className="sticky top-0 z-50 bg-gradient-to-b from-[#070707] via-[#070707] to-transparent px-[15px] pb-5 pt-5"><PageHeader fallbackHref={fallbackHref} title="Publicación" /></header>
    {error ? <p role="alert" className="px-[15px] pt-4 text-sm text-[#DE5757]">{error}</p> : null}
    {loading ? <PostSkeleton count={1} /> : post ? <ActivityPostArticle item={post} action={action} eventPaths={eventPaths} detail /> : <p className="px-[15px] py-10 text-white/50">No encontramos esta publicación.</p>}
    {post ? <section id="comentarios" className="mx-auto mt-[30px] w-full max-w-[640px] px-[15px]">
      <h2 className="text-[20px] font-semibold leading-6">Comentarios</h2>
      <PostComments postId={post.id} />
    </section> : null}
  </div>;
}
