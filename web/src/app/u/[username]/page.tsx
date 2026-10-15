import { Suspense } from "react";
import PublicCreatorProfile from "./PublicCreatorProfile";

async function CreatorProfileContent({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <PublicCreatorProfile username={username} />;
}

export default function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#080810] px-5 py-16 text-gray-300">Loading creator profile...</main>}>
      <CreatorProfileContent params={params} />
    </Suspense>
  );
}
