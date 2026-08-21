import { redirect } from 'next/navigation';
import { getCurrentProfile, createClient } from '@/lib/supabase/server';

const money = (v) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(Number(v || 0));

export default async function ReportsPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect('/login');
  if (!profile?.is_active || profile.role !== 'admin') redirect('/employee');

  const supabase = createClient();
  const [projectsResult, performanceResult, activityResult, collectionResult] = await Promise.all([
    supabase.from('projects').select('id,project_name,sales_stage,expected_value,probability,actual_contract_value,expected_closing_date,assigned_employee_id').order('expected_value', { ascending: false }),
    supabase.from('crm_employee_performance').select('*').order('expected_pipeline_value', { ascending: false }),
    supabase.from('crm_management_activity_report').select('*').maybeSingle(),
    supabase.from('crm_management_collection_report').select('*').maybeSingle(),
  ]);

  const projects = projectsResult.data || [];
  const employees = performanceResult.data || [];
  const activity = activityResult.data || {};
  const collection = collectionResult.data || {};
  const error = projectsResult.error || performanceResult.error || activityResult.error || collectionResult.error;

  const activeStages = ['Won / Contract', 'Collection', 'Closed', 'Lost'];
  const activeProjects = projects.filter((p) => !activeStages.includes(p.sales_stage));
  const expectedPipeline = activeProjects.reduce((s, p) => s + Number(p.expected_value || 0), 0);
  const weightedPipeline = activeProjects.reduce((s, p) => s + Number(p.expected_value || 0) * Number(p.probability || 0) / 100, 0);
  const contractValue = projects.reduce((s, p) => s + Number(p.actual_contract_value || 0), 0);
  const requiredCollection = Number(collection.required_collection || 0);
  const collected = Number(collection.collected_amount || 0);
  const outstanding = Number(collection.outstanding_amount || 0);
  const collectionPct = Number(collection.collection_percentage || 0);

  return (
    <main style={{ padding: 32, fontFamily: 'Arial, sans-serif', background: '#f7f8fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <a href="/admin" style={{ color: '#555', textDecoration: 'none' }}>← Back to CRM</a>
        <h1 style={{ marginBottom: 4 }}>Management Reports</h1>
        <p style={{ color: '#666', marginTop: 0 }}>Live reporting directly from the CRM database.</p>
        {error && <div style={{ background: '#fee2e2', padding: 14, borderRadius: 8, margin: '16px 0' }}>{error.message}</div>}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, margin: '24px 0' }}>
          {[
            ['Expected Pipeline', money(expectedPipeline)],
            ['Weighted Pipeline', money(weightedPipeline)],
            ['Contract Value', money(contractValue)],
            ['Required Collection', money(requiredCollection)],
            ['Collected', money(collected)],
            ['Outstanding', `${money(outstanding)} (${collectionPct}%)`],
          ].map(([label, value]) => <div key={label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 18 }}><div style={{ color: '#6b7280', fontSize: 12 }}>{label}</div><strong style={{ display: 'block', marginTop: 8, fontSize: 20 }}>{value}</strong></div>)}
        </section>

        <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 20, overflowX: 'auto' }}>
          <h2>Activity Summary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
            {[
              ['Activities', activity.total_activities], ['Meetings', activity.meetings], ['Visits', activity.visits],
              ['Calls', activity.calls], ['Technical Meetings', activity.technical_meetings], ['Overdue', activity.overdue_followups],
            ].map(([label, value]) => <div key={label} style={{ border: '1px solid #eee', borderRadius: 8, padding: 14 }}><div style={{ color: '#666', fontSize: 12 }}>{label}</div><strong style={{ fontSize: 20 }}>{Number(value || 0)}</strong></div>)}
          </div>
        </section>

        <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 20, overflowX: 'auto' }}>
          <h2>Employee Performance</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Employee','Projects','Active','Won','Lost','Pipeline','Weighted','Contract','Required','Collected','Outstanding','Activities','Overdue'].map(h => <th key={h} style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #ddd', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
          <tbody>{employees.map(e => <tr key={e.employee_id}>{[
            e.full_name,e.project_count,e.active_projects,e.won_projects,e.lost_projects,money(e.expected_pipeline_value),money(e.weighted_pipeline_value),money(e.contract_value),money(e.required_collection),money(e.collected_amount),money(e.outstanding_amount),e.activity_count,e.overdue_followups,
          ].map((v,i) => <td key={i} style={{ padding: 10, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{v}</td>)}</tr>)}</tbody></table>
          {!employees.length && <p style={{ color: '#777' }}>No employee performance data yet.</p>}
        </section>

        <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, overflowX: 'auto' }}>
          <h2>Project Sales Report</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Project','Stage','Expected','Probability','Weighted','Contract','Closing Date'].map(h => <th key={h} style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #ddd', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
          <tbody>{projects.map(r => <tr key={r.id}>{[
            r.project_name,r.sales_stage,money(r.expected_value),`${Number(r.probability || 0)}%`,money(Number(r.expected_value || 0) * Number(r.probability || 0) / 100),money(r.actual_contract_value),r.expected_closing_date || '—',
          ].map((v,i) => <td key={i} style={{ padding: 10, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{v}</td>)}</tr>)}</tbody></table>
          {!projects.length && <p style={{ color: '#777' }}>No project data yet.</p>}
        </section>
      </div>
    </main>
  );
}
