import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LEVELS } from "@/lib/constants";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <main className="max-w-xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-1">Mijn profiel</h1>
      <p className="text-zinc-500 text-sm mb-6">
        Je e-mailadres is <strong>{user.email}</strong>.
      </p>
      <ProfileForm
        initialName={user.name ?? ""}
        initialLevel={user.level ?? ""}
        levels={LEVELS}
      />
    </main>
  );
}
