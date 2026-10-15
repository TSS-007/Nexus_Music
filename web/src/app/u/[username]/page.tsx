import PublicCreatorProfile from "./PublicCreatorProfile";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <PublicCreatorProfile username={username} />;
}
