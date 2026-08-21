'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ProjectWorkspace() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: events }] = await Promise.all([
        supabase.from('projects').select('*, companies(company_name), employees:assigned_employee_id(full_name)').eq('id', id).single(),
        supabase.from('crm_project_timeline').select('*').eq('project_id', id).order('event_date', { ascending: false }),
      ]);
      if (active) {
        setProject(p || null);
        setTimeline(events || []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) return <main className="p-6">Loading project...</main>;
  if (!project) return <main className="p-6">Project not found.</main>;

  const money = (v) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(v || 0));
  const weighted = Number(project.expected_value || 0) * Number(project.probability || 0) / 100;

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Project Workspace</p>
          <h1 className="text-3xl font-semibold">{project.project_name}</h1>
          <p className="text-gray-600">{project.companies?.company_name || '—'}</p>
        </div>
        <div className="text-right">
          <div className="font-medium">{project.sales_stage || 'Lead'}</div>
          <div className="text-sm text-gray-500">{project.probability ?? 0}% probability</div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Card title="Expected Value" value={money(project.expected_value)} />
        <Card title="Weighted Value" value={money(weighted)} />
        <Card title="Contract Value" value={money(project.actual_contract_value)} />
        <Card title="Expected Closing" value={project.expected_closing_date || '—'} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-semibold">Project Timeline</h2>
          <div className="space-y-4">
            {timeline.length === 0 && <p className="text-sm text-gray-500">No timeline events yet.</p>}
            {timeline.map((event) => (
              <div key={`${event.event_type}-${event.event_id}`} className="border-l-2 pl-4">
                <div className="font-medium">{event.title}</div>
                <div className="text-xs text-gray-500">{event.event_date ? new Date(event.event_date).toLocaleString() : '—'} · {event.event_type}</div>
                {event.notes && <p className="mt-1 text-sm text-gray-700">{event.notes}</p>}
                {event.result && <p className="text-sm text-gray-600">Result: {event.result}</p>}
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <Card title="Owner" value={project.employees?.full_name || 'Unassigned'} />
          <Card title="Company" value={project.companies?.company_name || '—'} />
          <Card title="Contract No." value={project.contract_number || '—'} />
          <Card title="Location" value={project.location || '—'} />
        </aside>
      </section>
    </main>
  );
}

function Card({ title, value }) {
  return <div className="rounded-xl border bg-white p-4"><div className="text-xs uppercase tracking-wide text-gray-500">{title}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>;
}
