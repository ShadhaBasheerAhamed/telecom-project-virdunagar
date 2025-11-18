// Type guards for modal form data validation

// Lead type guards
export const isValidLeadFunnel = (value: string): value is 'New' | 'Contacted' | 'Qualified' | 'Negotiating' => {
  return ['New', 'Contacted', 'Qualified', 'Negotiating'].includes(value);
};

export const isValidLeadStatus = (value: string): value is 'Hot' | 'Warm' | 'Cold' => {
  return ['Hot', 'Warm', 'Cold'].includes(value);
};

export const isValidLeadSource = (value: string): value is 'BSNL' | 'RMAX' => {
  return ['BSNL', 'RMAX'].includes(value);
};

// Customer type guards
export const isValidCustomerStatus = (value: string): value is 'Active' | 'Suspended' | 'Expired' => {
  return ['Active', 'Suspended', 'Expired'].includes(value);
};

export const isValidCustomerSource = (value: string): value is 'BSNL' | 'RMAX' => {
  return ['BSNL', 'RMAX'].includes(value);
};

// Complaint type guards
export const isValidComplaintPriority = (value: string): value is 'Low' | 'Medium' | 'High' | 'Urgent' => {
  return ['Low', 'Medium', 'High', 'Urgent'].includes(value);
};

export const isValidComplaintStatus = (value: string): value is 'Pending' | 'In Progress' | 'Solved' | 'Closed' => {
  return ['Pending', 'In Progress', 'Solved', 'Closed'].includes(value);
};

export const isValidComplaintSource = (value: string): value is 'BSNL' | 'RMAX' => {
  return ['BSNL', 'RMAX'].includes(value);
};

// Generic type assertion helper
export const assertType = <T extends string>(value: string, validator: (v: string) => boolean): T => {
  if (!validator(value)) {
    throw new Error(`Invalid value: ${value}`);
  }
  return value as T;
};

// Safe setter for form data with type validation
export const safeSetFormData = <T extends string>(
  current: Record<string, any>,
  key: string,
  value: string,
  validator: (v: string) => boolean
): Record<string, any> => {
  return {
    ...current,
    [key]: validator(value) ? value : current[key]
  };
};