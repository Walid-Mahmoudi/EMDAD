import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

function formatEGP(value) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}

const stageLabels = {
  1: "تسعير وفني",
  2: "تحت التقييم",
  3: "مفاوضات",
  4: "قفل المشروع",
};

export default async function EmployeeDashboard() {
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, companies(name)")
    .eq("assigned_employee_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-ink/50">لوحة الموظف</p>
            <h1 className="font-display font-semibold text-lg">
              أهلاً، {profile?.full_name || ""}
            </h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="font-display font-semibold text-lg mb-4">
          مشاريعي ({projects?.length || 0})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-line rounded-2xl p-5 hover:border-brand/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium bg-brand-light text-brand-dark rounded-full px-2.5 py-1">
                  {stageLabels[p.stage_id] || "—"}
                </span>
              </div>
              <h3 className="font-medium mb-1">{p.name}</h3>
              <p className="text-sm text-ink/50 mb-3">
                {p.companies?.name}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink/50">القيمة المتوقعة</span>
                <span className="font-medium">
                  {formatEGP(p.expected_value)}
                </span>
              </div>
              {p.contract_value && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-ink/50">قيمة العقد</span>
                  <span className="font-medium text-brand">
                    {formatEGP(p.contract_value)}
                  </span>
                </div>
              )}
            </div>
          ))}

          {!projects?.length && (
            <div className="col-span-full text-center py-16 text-ink/40">
              لسه مفيش مشاريع اتوزعت عليك. تواصل مع المدير.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
