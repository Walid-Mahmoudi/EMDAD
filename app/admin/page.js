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

export default async function AdminDashboard() {
  const supabase = createClient();
  const { profile } = await getCurrentProfile();

  const { data: kpis } = await supabase
    .from("employee_kpis")
    .select("*")
    .order("won_value", { ascending: false });

  const { data: openProjects } = await supabase
    .from("project_summary")
    .select("*")
    .eq("outcome", "open");

  const totalPipeline =
    openProjects?.reduce((sum, p) => sum + (p.expected_value || 0), 0) || 0;
  const totalWon =
    kpis?.reduce((sum, e) => sum + (e.won_value || 0), 0) || 0;
  const totalFollowUps =
    kpis?.reduce((sum, e) => sum + (e.total_follow_ups || 0), 0) || 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-ink/50">لوحة المدير</p>
            <h1 className="font-display font-semibold text-lg">
              أهلاً، {profile?.full_name || "المدير"}
            </h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* إجماليات الشركة */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-line rounded-2xl p-5">
            <p className="text-sm text-ink/50 mb-1">قيمة المشاريع المفتوحة</p>
            <p className="text-2xl font-display font-semibold">
              {formatEGP(totalPipeline)}
            </p>
          </div>
          <div className="bg-white border border-line rounded-2xl p-5">
            <p className="text-sm text-ink/50 mb-1">قيمة المشاريع المقفولة</p>
            <p className="text-2xl font-display font-semibold text-brand">
              {formatEGP(totalWon)}
            </p>
          </div>
          <div className="bg-white border border-line rounded-2xl p-5">
            <p className="text-sm text-ink/50 mb-1">إجمالي المتابعات</p>
            <p className="text-2xl font-display font-semibold">
              {totalFollowUps}
            </p>
          </div>
        </section>

        {/* أداء الموظفين */}
        <section>
          <h2 className="font-display font-semibold text-lg mb-4">
            أداء الموظفين
          </h2>
          <div className="bg-white border border-line rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-ink/50 text-xs">
                  <th className="text-right font-medium px-5 py-3">الموظف</th>
                  <th className="text-right font-medium px-5 py-3">
                    المشاريع
                  </th>
                  <th className="text-right font-medium px-5 py-3">
                    نسبة التحويل
                  </th>
                  <th className="text-right font-medium px-5 py-3">
                    قيمة المقفول
                  </th>
                  <th className="text-right font-medium px-5 py-3">
                    Pipeline المفتوح
                  </th>
                  <th className="text-right font-medium px-5 py-3">
                    المتابعات
                  </th>
                </tr>
              </thead>
              <tbody>
                {kpis?.map((emp) => (
                  <tr
                    key={emp.employee_id}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-5 py-3 font-medium">
                      {emp.full_name}
                    </td>
                    <td className="px-5 py-3">
                      {emp.won_projects} / {emp.total_projects}
                    </td>
                    <td className="px-5 py-3">
                      {emp.conversion_rate_pct}%
                    </td>
                    <td className="px-5 py-3 text-brand font-medium">
                      {formatEGP(emp.won_value)}
                    </td>
                    <td className="px-5 py-3">
                      {formatEGP(emp.open_pipeline_value)}
                    </td>
                    <td className="px-5 py-3">{emp.total_follow_ups}</td>
                  </tr>
                ))}
                {!kpis?.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-ink/40"
                    >
                      لسه مفيش موظفين مضافين. ابدأ بإضافة موظف من صفحة إدارة
                      الفريق.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
