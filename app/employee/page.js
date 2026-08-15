import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import AddEmployeeForm from "@/components/AddEmployeeForm";

export default async function EmployeesPage() {
  const supabase = createClient();

  const { data: employees } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "employee")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-ink/50 hover:text-ink">
              ← لوحة المدير
            </Link>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-semibold text-lg">
            إدارة الموظفين
          </h1>
          <AddEmployeeForm />
        </div>

        <div className="bg-white border border-line rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-ink/50 text-xs">
                <th className="text-right font-medium px-5 py-3">الاسم</th>
                <th className="text-right font-medium px-5 py-3">
                  رقم الموبايل
                </th>
                <th className="text-right font-medium px-5 py-3">الحالة</th>
                <th className="text-right font-medium px-5 py-3">
                  تاريخ الإضافة
                </th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp) => (
                <tr key={emp.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium">{emp.full_name}</td>
                  <td className="px-5 py-3 text-ink/60">
                    {emp.phone || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-medium rounded-full px-2.5 py-1 ${
                        emp.is_active
                          ? "bg-brand-light text-brand-dark"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {emp.is_active ? "نشط" : "معطّل"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink/60">
                    {new Date(emp.created_at).toLocaleDateString("ar-EG")}
                  </td>
                </tr>
              ))}
              {!employees?.length && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-ink/40">
                    لسه مفيش موظفين. دوس "إضافة موظف" عشان تبدأ.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
