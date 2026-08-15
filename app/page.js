import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function HomePage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) redirect("/login");
  redirect(profile?.role === "admin" ? "/admin" : "/employee");
}
