import { redirect } from "next/navigation";
type Props = { params: Promise<{ slug: string }> };
export default async function LegacyReviewDetail({ params }: Props) { const { slug } = await params; redirect(`/review/${encodeURIComponent(slug)}`); }
