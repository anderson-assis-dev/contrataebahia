import http from './http';

/** Diz se o assistente está ligado no servidor, para a tela decidir se aparece. */
export const assistantStatus = async () => {
  const { data } = await http.get('/orders/assistant/status');
  return Boolean(data?.data?.disponivel);
};

/**
 * Pede ao assistente que leia o rascunho do pedido.
 *
 * Responde com as perguntas que faltam responder, o que está faltando e uma
 * versão organizada da descrição. Com título e categoria apenas, redige um
 * rascunho deixando as lacunas à vista para o cliente completar.
 */
export const reviewOrderDraft = async ({ titulo, categoria, descricao }) => {
  const { data } = await http.post('/orders/assistant/review', {
    titulo: titulo || '',
    categoria: categoria || '',
    descricao: descricao || '',
  });
  return data?.data || null;
};

/**
 * Pede à BIA a leitura de uma demanda, do ponto de vista de quem vai propor.
 *
 * Volta sempre com `dados` (números calculados no servidor) e, quando a IA
 * está ligada e respondeu, com `analise`. A tela precisa aguentar `analise`
 * nula: os números sozinhos já ajudam.
 */
export const coachProposal = async (orderId) => {
  const { data } = await http.post(`/orders/${orderId}/assistant/proposal-coach`);
  return data?.data || null;
};
