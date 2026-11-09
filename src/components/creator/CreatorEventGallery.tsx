"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";
import PostReactions from "@/components/activity/PostReactions";
import StarRating from "@/components/reviews/StarRating";

type Post = { id: string; creator_id: string; title: string; description: string; gallery_name: string; purchase_url: string | null; activity_post_id: string | null; published_at: string | null };
type Photo = { id: string; publication_id: string; image_url: string; sort_order: number };
type Creator = { user_id: string; username: string; first_name: string | null; last_name: string | null; avatar_url: string | null };
type Comment = { id: string; publication_id: string; user_id: string; body: string; rating: number | null; created_at: string };

export default function CreatorEventGallery({ event }: { event: { id: string; name: string; cover: string | null; slug: string } }) {
  const params = useSearchParams();
  const selected = params.get("publicacion");
  const { user } = useAthleteAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [commenters, setCommenters] = useState<Creator[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    void supabase.from("creator_publications").select("id,creator_id,title,description,gallery_name,purchase_url,activity_post_id,published_at")
      .eq("race_event_id", event.id).eq("status", "published").order("published_at", { ascending: false }).then(async ({ data }) => {
        const next = (data || []) as Post[];
        if (!active) return;
        setPosts(next);
        if (!next.length) return;
        const [{ data: images }, { data: profiles }, { data: replies }, { data: reactions }] = await Promise.all([
          supabase.from("creator_photos").select("id,publication_id,image_url,sort_order").in("publication_id", next.map((post) => post.id)).order("sort_order"),
          supabase.from("athlete_profiles").select("user_id,username,first_name,last_name,avatar_url").in("user_id", [...new Set(next.map((post) => post.creator_id))]),
          supabase.from("creator_publication_comments").select("id,publication_id,user_id,body,rating,created_at").in("publication_id", next.map((post) => post.id)).order("created_at", { ascending: false }),
          supabase.from("activity_post_reactions").select("post_id,user_id").eq("reaction_type", "like").in("post_id", next.map((post) => post.activity_post_id).filter((id): id is string => Boolean(id))),
        ]);
        if (active) { setPhotos((images || []) as Photo[]); setCreators((profiles || []) as Creator[]); setComments((replies || []) as Comment[]);
          const values: Record<string, { count: number; liked: boolean }> = {};
          for (const post of next) if (post.activity_post_id) values[post.activity_post_id] = { count: 0, liked: false };
          for (const reaction of reactions || []) if (values[reaction.post_id]) { values[reaction.post_id].count += 1; if (reaction.user_id === user?.id) values[reaction.post_id].liked = true; }
          setLikes(values);
        }
        const commenterIds = [...new Set((replies || []).map((reply) => reply.user_id))];
        if (commenterIds.length) {
          const { data: people } = await supabase.from("athlete_profiles").select("user_id,username,first_name,last_name,avatar_url").in("user_id", commenterIds);
          if (active) setCommenters((people || []) as Creator[]);
        }
      });
    return () => { active = false; };
  }, [event.id]);

  useEffect(() => {
    if (!user || !posts.length) return;
    void supabase.from("creator_publication_saves").select("publication_id").eq("user_id", user.id).in("publication_id", posts.map((post) => post.id))
      .then(({ data }) => setSaved((data || []).map((item) => item.publication_id)));
  }, [user?.id, posts.length]);

  useEffect(() => {
    if (!selected || !posts.some((post) => post.id === selected)) return;
    const key = "dorsalia-creator-visitor";
    let token = window.localStorage.getItem(key);
    if (!token) { token = crypto.randomUUID(); window.localStorage.setItem(key, token); }
    void supabase.rpc("record_creator_publication_view", { p_publication_id: selected, p_visitor_token: token });
  }, [selected, posts]);

  async function toggleSave(id: string) {
    if (!user) { window.location.assign(`/auth?next=${encodeURIComponent(window.location.pathname + window.location.search)}`); return; }
    const query = saved.includes(id) ? supabase.from("creator_publication_saves").delete().eq("publication_id", id).eq("user_id", user.id)
      : supabase.from("creator_publication_saves").insert({ publication_id: id, user_id: user.id });
    const { error: saveError } = await query;
    if (saveError) setError(saveError.message); else setSaved((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function comment(postId: string, event: React.FormEvent) {
    event.preventDefault();
    if (!user) { window.location.assign(`/auth?next=${encodeURIComponent(window.location.pathname + window.location.search)}`); return; }
    if (!body.trim() && !rating) return;
    const { data, error: commentError } = await supabase.from("creator_publication_comments")
      .insert({ publication_id: postId, user_id: user.id, body: body.trim(), rating: rating || null }).select("id,publication_id,user_id,body,rating,created_at").single();
    if (commentError) { setError(commentError.message); return; }
    setComments((current) => [data as Comment, ...current]);
    if (!commenters.some((person) => person.user_id === user.id)) {
      const { data: person } = await supabase.from("athlete_profiles").select("user_id,username,first_name,last_name,avatar_url").eq("user_id", user.id).maybeSingle();
      if (person) setCommenters((current) => [...current, person as Creator]);
    }
    setBody(""); setRating(0); setError("");
  }

  const visible = selected ? posts.filter((post) => post.id === selected) : posts;
  return <div className="px-[15px] pb-20"><PageHeader fallbackHref={`/review/${event.slug}`} title={selected ? "Galería" : "Fotos del evento"} sticky />
    <main className="mx-auto w-full max-w-[640px]">
      <h1 className="mt-10 text-[24px] font-bold">Fotos de {event.name}</h1>
      {event.cover && !selected ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={event.cover} alt="" className="mt-5 aspect-video w-full rounded-[20px] object-cover" /> : null}
      {!posts.length ? <p className="mt-10 text-white/50">Aún no hay galerías de fotógrafos para este evento.</p> : null}
      <div className="mt-8 space-y-10">{visible.map((post) => { const creator = creators.find((person) => person.user_id === post.creator_id); const gallery = photos.filter((photo) => photo.publication_id === post.id); const replies = comments.filter((reply) => reply.publication_id === post.id); return <article key={post.id} className="border-b border-white/15 pb-8">
        <div className="flex items-center gap-3">{creator?.avatar_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={creator.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : null}<Link href={`/perfil/${creator?.username || post.creator_id}`} className="min-w-0 flex-1"><strong className="block truncate text-[16px]">{[creator?.first_name, creator?.last_name].filter(Boolean).join(" ") || "Fotógrafo Dorsalia"} <span className="text-[#C5E500]" aria-label="Fotógrafo">✦</span></strong><small className="text-white/50">{post.published_at ? new Date(post.published_at).toLocaleDateString("es-MX") : ""}</small></Link>{post.activity_post_id && likes[post.activity_post_id] ? <PostReactions postId={post.activity_post_id} initialLikes={likes[post.activity_post_id].count} initialLiked={likes[post.activity_post_id].liked} /> : null}</div>
        {gallery.length ? <div className="mt-4 flex snap-x snap-mandatory overflow-x-auto rounded-[20px]">{gallery.map((photo) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={photo.id} src={photo.image_url} alt={`Foto de ${post.gallery_name}`} className="aspect-square w-full min-w-full snap-center object-cover" />)}</div> : null}
        <div className="mt-4 flex items-start justify-between gap-3"><div><h2 className="text-[20px] font-semibold">{post.title}</h2><p className="mt-1 text-sm text-white/60">{post.gallery_name}</p></div>{!selected ? <Link href={`/fotos/${event.slug}?publicacion=${post.id}`} className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Ver fotos</Link> : null}</div>
        {selected ? <><p className="mt-4 whitespace-pre-line text-[16px] text-white/80">{post.description}</p>{post.purchase_url ? <a href={post.purchase_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block rounded-full bg-white px-5 py-3 font-semibold text-black">Ir al canal de fotos</a> : null}<button type="button" onClick={() => void toggleSave(post.id)} className="ml-3 rounded-full border border-white/30 px-4 py-3 text-sm">{saved.includes(post.id) ? "Guardado" : "Guardar"}</button><h3 className="mt-8 text-[20px] font-semibold">Comentarios</h3><form onSubmit={(event) => void comment(post.id, event)} className="mt-3"><StarRating value={rating} onChange={setRating} size={20} /><textarea value={body} onChange={(event) => setBody(event.target.value.slice(0, 2000))} placeholder="Escribe un comentario" className="mt-3 min-h-20 w-full rounded-[20px] bg-[#191919] p-[15px] outline-none" /><button type="submit" className="mt-2 rounded-full bg-white px-5 py-2 font-semibold text-black">Publicar comentario</button></form>{replies.map((reply) => { const person = commenters.find((entry) => entry.user_id === reply.user_id); return <div key={reply.id} className="mt-5 border-t border-white/15 pt-4">{reply.rating ? <StarRating value={reply.rating} size={18} /> : null}<div className="mt-3 flex items-center gap-2">{person?.avatar_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={person.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="h-9 w-9 rounded-full bg-white/10" />}<div><strong className="block text-[15px]">{[person?.first_name, person?.last_name].filter(Boolean).join(" ") || person?.username || "Usuario"}</strong><small className="text-white/50">{new Date(reply.created_at).toLocaleDateString("es-MX")}</small></div></div>{reply.body ? <p className="mt-3 text-[15px]">{reply.body}</p> : null}</div>; })}</> : null}
      </article>; })}</div>{error ? <p role="alert" className="text-[#DE5757]">{error}</p> : null}
    </main>
  </div>;
}
