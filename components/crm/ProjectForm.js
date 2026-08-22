'use client';

import { useState } from 'react';
import { CRM_STAGES, getAllowedNextStages, probabilityForStage, canTransition } from '@/lib/crm/workflow';

const sectors = ['Commercial','Residential','Banking','Administrative','Industrial','Hospitality','Hotels','Medical','Other'];

function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label>; }
function Input({value,onChange,...props}) { return <input value={value??''} onChange={e=>onChange(e.target.value)} {...props}/>; }

export default function ProjectForm({data,companies,employees,isAdmin,onSave}) {
  const [f,setF]=useState({project_name:'',company_id:'',project_type:'VRF',sector:'Commercial',location:'',area:'',consultant:'',contractor:'',key_person:'',key_person_mobile:'',assigned_employee_id:'',project_status:'Active',sales_stage:'Lead',expected_value:0,probability:10,actual_contract_value:0,contract_number:'',contract_date:'',start_date:'',expected_closing_date:'',lost_reason:'',admin_close_override:false,notes:'',...data});
  const [formError,setFormError]=useState('');
  const u=(k,v)=>setF(x=>({...x,[k]:v}));
  const currentStage=data?.sales_stage || 'Lead';
  const allowedStages=data ? getAllowedNextStages(currentStage,isAdmin) : ['Lead'];
  const stageOptions=data ? [currentStage,...allowedStages.filter(s=>s!==currentStage)] : CRM_STAGES.filter(s=>s==='Lead');
  const stageChanged=f.sales_stage!==currentStage;

  const changeStage=(next)=>{
    if(!canTransition(currentStage,next,isAdmin)){
      setFormError('This stage change is not allowed. Follow the defined sales workflow.');
      return;
    }
    u('sales_stage',next);
    u('probability',probabilityForStage(next));
    if(next!=='Lost') u('lost_reason','');
  };

  const submit=()=>{
    setFormError('');
    if(!f.project_name.trim() || !f.company_id){ setFormError('Project Name and Company are required.'); return; }
    if(!canTransition(currentStage,f.sales_stage,isAdmin)){
      setFormError('This stage change is not allowed. Follow the defined sales workflow.'); return;
    }
    if(f.sales_stage==='Lost' && !f.lost_reason.trim()){ setFormError('Please enter a lost reason before moving the project to Lost.'); return; }
    if(['Won / Contract','Collection','Closed'].includes(f.sales_stage) && (!String(f.contract_number||'').trim() || !f.contract_date || Number(f.actual_contract_value||0)<=0)){
      setFormError('Contract Number, Contract Date and Actual Contract Value are required for this stage.'); return;
    }
    if(f.sales_stage==='Closed' && isAdmin===false && f.admin_close_override){ setFormError('Only an Admin can override the collection requirement for closing a project.'); return; }
    onSave({...f,expected_value:Number(f.expected_value||0),probability:Number(f.probability||0),actual_contract_value:Number(f.actual_contract_value||0),assigned_employee_id:f.assigned_employee_id||null});
  };

  return <form className="form-grid" onSubmit={e=>{e.preventDefault();submit()}}>
    {formError&&<div className="error-banner">{formError}</div>}
    <Field label="Project Name *"><Input value={f.project_name} onChange={v=>u('project_name',v)} required/></Field>
    <Field label="Company *"><select value={f.company_id} onChange={e=>u('company_id',e.target.value)}><option value="">Select company</option>{companies.map(c=><option key={c.id} value={c.id}>{c.company_name}</option>)}</select></Field>
    <Field label="Project Type"><Input value={f.project_type} onChange={v=>u('project_type',v)}/></Field>
    <Field label="Sector"><select value={f.sector||''} onChange={e=>u('sector',e.target.value)}><option value="">Select</option>{sectors.map(x=><option key={x}>{x}</option>)}</select></Field>
    <Field label="Location"><Input value={f.location} onChange={v=>u('location',v)}/></Field>
    <Field label="Area"><Input value={f.area} onChange={v=>u('area',v)}/></Field>
    <Field label="Consultant"><Input value={f.consultant} onChange={v=>u('consultant',v)}/></Field>
    <Field label="Contractor"><Input value={f.contractor} onChange={v=>u('contractor',v)}/></Field>
    <Field label="Key Person"><Input value={f.key_person} onChange={v=>u('key_person',v)}/></Field>
    <Field label="Key Person Mobile"><Input value={f.key_person_mobile} onChange={v=>u('key_person_mobile',v)}/></Field>
    {isAdmin&&<Field label="Assigned Employee"><select value={f.assigned_employee_id||''} onChange={e=>u('assigned_employee_id',e.target.value)}><option value="">Unassigned</option>{employees.filter(e=>e.is_active).map(e=><option key={e.id} value={e.id}>{e.full_name}</option>)}</select></Field>}
    <Field label="Sales Stage"><select value={f.sales_stage} onChange={e=>changeStage(e.target.value)}>{stageOptions.map(x=><option key={x}>{x}</option>)}</select></Field>
    <Field label="Expected Value"><Input type="number" value={f.expected_value} onChange={v=>u('expected_value',v)}/></Field>
    <Field label="Probability %"><Input type="number" min="0" max="100" value={f.probability} onChange={v=>u('probability',v)} /></Field>
    <Field label="Actual Contract Value"><Input type="number" value={f.actual_contract_value} onChange={v=>u('actual_contract_value',v)}/></Field>
    <Field label="Contract Number"><Input value={f.contract_number} onChange={v=>u('contract_number',v)}/></Field>
    <Field label="Contract Date"><Input type="date" value={f.contract_date||''} onChange={v=>u('contract_date',v)}/></Field>
    <Field label="Expected Closing Date"><Input type="date" value={f.expected_closing_date||''} onChange={v=>u('expected_closing_date',v)}/></Field>
    {f.sales_stage==='Lost'&&<Field label="Lost Reason *"><Input value={f.lost_reason} onChange={v=>u('lost_reason',v)}/></Field>}
    {isAdmin&&f.sales_stage==='Closed'&&<label className="check"><input type="checkbox" checked={f.admin_close_override} onChange={e=>u('admin_close_override',e.target.checked)}/> Admin override collection closure rule</label>}
    <Field label="Notes"><textarea value={f.notes||''} onChange={e=>u('notes',e.target.value)}/></Field>
    <div className="form-actions"><button type="submit" className="primary">Save record</button></div>
  </form>;
}
