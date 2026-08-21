import { redirect } from 'next/navigation';
import { getCurrentProfile, createClient } from '@/lib/supabase/server';

const money = (v) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(Number(v || 0));

export default async function ReportsPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect('/login');
  if (!profile?.is_active || profile.role !== 'admin') redirect('/employee');

  const supabase = createClient();
  const [{ data: financials, error: financialError }, { data: performance, error: performanceError }] = await Promise.all([
    supabase.from('crm_project_financials').select('*').order('weighted_value', { ascending: false }),
    supabase.from('crm_employee_performance').select('*').order('pipeline_value', { ascending: false }),
  ]);

  const rows = financials || [];
  const employees = performance || [];
  const totalExpected = rows.reduce((s, r) => s + Number(r.expected_value || 0), 0);
  const totalWeighted = rows.reduce((s, r) => s + Number(r.weighted_value || 0), 0);
  const totalContract = rows.reduce((s, r) => s + Number(r.actual_contract_value || 0), 0);
  const totalRequired = rows.reduce((s, r) => s + Number(r.required_collection || 0), 0);
  const totalCollected = rows.reduce((s, r) => s + Number(r.collected_amount || 0), 0);
  const totalOutstanding = Math.max(totalRequired - totalCollected, 0);
  const collectionPct = totalRequired ? Math.round(totalCollected / totalRequired * 100) : 0;
  const error = financialError || performanceError;

  return (
    <main style={{ padding: 32, fontFamily: 'Arial, sans-serif', background: '#f7f8fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <a href="/admin" style={{ color: '#555', textDecoration: 'none' }}>← Back to CRM</a>
        <h1 style={{ marginBottom: 4 }}>Management Reports</h1>
        <p style={{ color: '#666', marginTop: 0 }}>Live reporting directly from the CRM database.</p>
        {error && <div style={{ background: '#fee2e2', padding: 14, borderRadius: 8, margin: '16px 0' }}>{error.message}</div>}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, margin: '24px 0' }}>
          {[
            ['Expected Pipeline', money(totalExpected)], ['Weighted Pipeline', money(totalWeighted)], ['Contract Value', money(totalContract)],
            ['Required Collection', money(totalRequired)], ['Collected', money(totalCollected)], ['Outstanding', money(totalOutstanding) + ` (${collectionPct}%)`]
          ].map(([label, value]) => <div key={label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 18 }}><div style={{ color: '#6b7280', fontSize: 12 }}>{label}</div><strong style={{ display: 'block', marginTop: 8, fontSize: 20 }}>{value}</strong></div>)}
        </section>
        <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 20, overflowX: 'auto' }}>
          <h2>Employee Performance</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Employee','Projects','Active','Won','Lost','Pipeline','Weighted','Contract','Collected','Outstanding','Activities','Overdue'].map(h => <th key={h} style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #ddd', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
          <tbody>{employees.map(e => <tr key={e.employee_id}>{[e.full_name,e.projects_count,e.active_projects,e.won_projects,e.lost_projects,money(e.pipeline_value),money(e.weighted_pipeline_value),money(e.contract_value),money(e.collected_value),money(e.outstanding_value),e.activities_count,e.overdue_followups].map((v,i) => <td key={i} style={{ padding: 10, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{v}</td>)}</tr>)}</tbody></table>
          {!employees.length && <p style={{ color: '#777' }}>No employee performance data yet.</p>}
        </section>
        <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, overflowX: 'auto' }}>
          <h2>Project Financial Report</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Project','Stage','Expected','Probability','Weighted','Contract','Required','Collected','Outstanding','Collection %'].map(h => <th key={h} style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #ddd', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
          <tbody>{rows.map(r => <tr key={r.project_id}>{[r.project_name,r.sales_stage,money(r.expected_value),`${r.probability}%`,money(r.weighted_value),money(r.actual_contract_value),money(r.required_collection),money(r.collected_amount),money(r.outstanding_amount),`${r.collection_percentage}%`].map((v,i) => <td key={i} style={{ padding: 10, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{v}</td>)}</tr>)}</tbody></table>
          {!rows.length && <p style={{ color: '#777' }}>No project financial data yet.</p>}
        </section>
      </div>
    </main>
  );
}
