import { createClient } from '@supabase/supabase-js';

// Production fallback points to the active Sales CRM project.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wnezgrrgvugezqwfeuce.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MSCLzBSq5UHwPk6F9TUuNA_-ugwxuyu';

const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// The projects table has several legitimate foreign keys to companies
// (customer, consultant, contractor, developer). Supabase therefore cannot
// infer which relationship to embed when the UI asks for companies(name).
// Keep the UI queries simple and disambiguate only queries that embed projects.
const disambiguateProjectCompany = (table, columns) => {
  if (typeof columns !== 'string') return columns;
  const needsProjectCompany =
    table === 'projects' ||
    table === 'pipeline' ||
    table === 'collections';
  if (!needsProjectCompany) return columns;
  return columns.replace(/companies\(name\)/g, 'companies!projects_company_id_fkey(name)');
};

export const supabase = new Proxy(client, {
  get(target, prop, receiver) {
    if (prop !== 'from') return Reflect.get(target, prop, receiver);
    return (table) => {
      const builder = target.from(table);
      const originalSelect = builder.select.bind(builder);
      builder.select = (columns, options) => originalSelect(disambiguateProjectCompany(table, columns), options);
      return builder;
    };
  },
});
