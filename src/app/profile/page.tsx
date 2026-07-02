import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LEVELS } from "@/lib/constants";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="max-w-xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
        Mijn profiel
      </h1>
      <p className="text-ink-muted text-sm mb-6">
        Je e-mailadres is <strong className="text-ink">{user.email}</strong>.
      </p>
      <ProfileForm
        initialName={user.name ?? ""}
        initialLevel={user.level ?? ""}
        levels={LEVELS}
      />
    </div>
  );
}
