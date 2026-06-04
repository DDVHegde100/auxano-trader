import { redirect } from "next/navigation";

export default async function UserShareIndex({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(`/u/${username}/week`);
}
