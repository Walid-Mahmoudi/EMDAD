export const CRM_STAGES = [
  'Lead',
  'Technical / Pricing',
  'Tender',
  'On Hand',
  'Negotiation',
  'Won / Contract',
  'Collection',
  'Closed',
  'Lost',
];

export const STAGE_PROBABILITY = {
  'Lead': 10,
  'Technical / Pricing': 25,
  'Tender': 45,
  'On Hand': 55,
  'Negotiation': 75,
  'Won / Contract': 100,
  'Collection': 100,
  'Closed': 100,
  'Lost': 0,
};

const TRANSITIONS = {
  'Lead': ['Technical / Pricing', 'Lost'],
  'Technical / Pricing': ['Tender', 'On Hand', 'Lost'],
  'Tender': ['Negotiation', 'Lost'],
  'On Hand': ['Negotiation', 'Lost'],
  'Negotiation': ['Won / Contract', 'Lost'],
  'Won / Contract': ['Collection', 'Closed'],
  'Collection': ['Closed'],
  'Closed': [],
  'Lost': [],
};

export function getAllowedNextStages(currentStage, isAdmin = false) {
  if (!currentStage) return ['Lead'];
  const next = TRANSITIONS[currentStage] || [];
  return isAdmin ? CRM_STAGES.filter(stage => stage !== currentStage) : next;
}

export function canTransition(currentStage, nextStage, isAdmin = false) {
  if (!nextStage || currentStage === nextStage) return true;
  return isAdmin || Boolean(TRANSITIONS[currentStage]?.includes(nextStage));
}

export function probabilityForStage(stage) {
  return STAGE_PROBABILITY[stage] ?? 0;
}

export function workflowError(message) {
  const text = String(message || '');
  if (text.includes('Invalid sales stage transition')) {
    return 'This stage change is not allowed. Follow the defined sales workflow.';
  }
  if (text.includes('Lost projects require a lost reason')) {
    return 'Please enter a lost reason before moving the project to Lost.';
  }
  if (text.includes('Contract number, contract date and positive actual contract value')) {
    return 'Contract Number, Contract Date and Actual Contract Value are required for this stage.';
  }
  if (text.includes('Project cannot be Closed while collection outstanding')) {
    return 'This project cannot be closed while there is an outstanding collection balance.';
  }
  if (text.includes('Only Admin can override project closure')) {
    return 'Only an Admin can override the collection requirement for closing a project.';
  }
  if (text.includes('Collected amount cannot exceed required amount')) {
    return 'Collected amount cannot exceed the required collection amount.';
  }
  return text || 'Unable to save the CRM record.';
}
