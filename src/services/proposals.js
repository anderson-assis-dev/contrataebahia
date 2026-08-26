import http from './http';

export const PROPOSAL_STATUS_LABEL = {
  pending: 'Aguardando',
  accepted: 'Aceita',
  rejected: 'Recusada',
  withdrawn: 'Retirada',
};

export const listProposals = async (params) => {
  const { data } = await http.get('/proposals', { params });
  return data;
};

export const getProposal = async (id) => {
  const { data } = await http.get(`/proposals/${id}`);
  return data;
};

export const createProposal = async (payload) => {
  const { data } = await http.post('/proposals', payload);
  return data;
};

export const updateProposal = async (id, payload) => {
  const { data } = await http.put(`/proposals/${id}`, payload);
  return data;
};

export const acceptProposal = async (id) => {
  const { data } = await http.post(`/proposals/${id}/accept`);
  return data;
};

export const rejectProposal = async (id) => {
  const { data } = await http.post(`/proposals/${id}/reject`);
  return data;
};

export const withdrawProposal = async (id) => {
  const { data } = await http.post(`/proposals/${id}/withdraw`);
  return data;
};

export const cancelAcceptance = async (id) => {
  const { data } = await http.post(`/proposals/${id}/cancel-acceptance`);
  return data;
};

export const getVisibility = async () => {
  const { data } = await http.get('/proposals/visibility');
  return data;
};
