import { useState } from 'react';

export interface EntityRequest {
  id: string;
  type: string;
  name: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function useEntityRequests() {
  const [requests, setRequests] = useState<EntityRequest[]>([]);

  // Placeholder: fetch, add, approve, reject logic will go here

  return {
    requests,
    setRequests,
    // addEntityRequest,
    // approveEntityRequest,
    // rejectEntityRequest,
  };
}