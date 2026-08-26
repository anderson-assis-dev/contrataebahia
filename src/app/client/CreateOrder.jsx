import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, MapPin, Paperclip, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { createOrder, getOrder, updateOrder } from '../../services/orders';
import { listCategories, lookupCep } from '../../services/catalog';
import { apiError } from '../../services/http';
import FullPageLoader from '../FullPageLoader';
import { STATIC_CATEGORIES } from '../../data/categories';
import { formatCep, formatMoney, onlyDigits } from '../../utils/format';
import '../forms.css';
import '../ui.css';
import './CreateOrder.css';

const FALLBACK_LABELS = STATIC_CATEGORIES.map((c) => c.label);
const MAX_FILES = 10;
const MAX_FILE_MB = 50;

const EMPTY = {
  title: '',
  description: '',
  category: '',
  budget: '',
  deadline: '7',
  zip_code: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

export default function CreateOrder() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();
  const editing = Boolean(id);
  const fileInput = useRef(null);
  const [categories, setCategories] = useState(FALLBACK_LABELS);
  const [form, setForm] = useState(EMPTY);
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [files, setFiles] = useState([]);
  const [cepLoading, setCepLoading] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return undefined;
    let active = true;
    getOrder(id)
      .then((json) => {
        if (!active || !json?.success) return;
        const order = json.data;
        if (order.proposals?.length > 0) {
          toast.info('Este pedido já recebeu propostas, então não pode mais ser editado.');
          navigate(`/app/pedidos/${id}`, { replace: true });
          return;
        }
        setForm({
          title: order.title || '',
          description: order.description || '',
          category: order.category || '',
          budget: String(Math.round(Number(order.budget || 0) * 100)),
          deadline: String(order.deadline || '7'),
          zip_code: formatCep(order.zip_code || ''),
          street: order.street || '',
          number: order.number || '',
          complement: order.complement || '',
          neighborhood: order.neighborhood || '',
          city: order.city || '',
          state: order.state || '',
        });
        setCoords({ latitude: order.latitude ?? null, longitude: order.longitude ?? null });
      })
      .catch(() => {
        if (active) toast.error('Não foi possível carregar o pedido para edição.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [editing, id, navigate, toast]);

  useEffect(() => {
    let active = true;
    listCategories(60)
      .then((json) => {
        if (!active) return;
        const labels = (json?.data || []).map((c) => c.label).filter(Boolean);
        if (labels.length) setCategories(labels);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const budgetPreview = useMemo(() => {
    const value = Number(onlyDigits(form.budget)) / 100;
    return value > 0 ? formatMoney(value) : '';
  }, [form.budget]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'zip_code') return setForm((f) => ({ ...f, zip_code: formatCep(value) }));
    if (name === 'budget') return setForm((f) => ({ ...f, budget: onlyDigits(value).slice(0, 10) }));
    return setForm((f) => ({ ...f, [name]: value }));
  };

  const handleCepBlur = async () => {
    const cep = onlyDigits(form.zip_code);
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const json = await lookupCep(cep);
      const data = json?.data;
      if (data) {
        setForm((f) => ({
          ...f,
          street: data.street || f.street,
          neighborhood: data.neighborhood || f.neighborhood,
          city: data.city || f.city,
          state: data.state || f.state,
        }));
        setCoords({ latitude: data.latitude ?? null, longitude: data.longitude ?? null });
      }
    } catch {
      toast.info('Não encontramos esse CEP. Preencha o endereço manualmente.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    const allowed = picked.filter((file) => {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" passa de ${MAX_FILE_MB} MB.`);
        return false;
      }
      return true;
    });
    setFiles((current) => [...current, ...allowed].slice(0, MAX_FILES));
    e.target.value = '';
  };

  const removeFile = (index) => setFiles((current) => current.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const budget = Number(onlyDigits(form.budget)) / 100;
    const deadline = Number(form.deadline);
    if (!form.category) {
      setError('Escolha a categoria do serviço.');
      return;
    }
    if (!(budget > 0)) {
      setError('Informe um orçamento de referência.');
      return;
    }
    if (!(deadline >= 1 && deadline <= 365)) {
      setError('O prazo deve ser entre 1 e 365 dias.');
      return;
    }
    const address = [form.street, form.number, form.neighborhood, form.city, form.state]
      .map((part) => (part || '').trim())
      .filter(Boolean)
      .join(', ');
    if (!address) {
      setError('Informe o endereço onde o serviço será feito.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        budget,
        deadline,
        address,
        street: form.street.trim() || undefined,
        number: form.number.trim() || undefined,
        complement: form.complement.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        zip_code: onlyDigits(form.zip_code) || undefined,
        latitude: coords.latitude ?? undefined,
        longitude: coords.longitude ?? undefined,
        attachments: files,
      };
      const json = editing ? await updateOrder(id, payload) : await createOrder(payload);
      if (json?.success) {
        toast.success(editing ? 'Pedido atualizado.' : 'Pedido publicado! Os profissionais já podem enviar propostas.');
        navigate(`/app/pedidos/${editing ? id : json.data?.id}`, { replace: true });
        return;
      }
      setError(json?.message || 'Não foi possível salvar o pedido.');
    } catch (err) {
      setError(apiError(err, 'Não foi possível salvar o pedido.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <FullPageLoader label="Carregando pedido..." />;

  return (
    <>
      <button type="button" className="page-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="page-head">
        <h1 className="page-title">{editing ? 'Editar pedido' : 'Novo pedido'}</h1>
        <p className="page-sub">
          {editing
            ? 'Ajuste os detalhes enquanto ninguém enviou proposta.'
            : 'Quanto mais detalhes você der, mais precisas serão as propostas que você recebe.'}
        </p>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        {error && (
          <div className="f-alert f-alert-err">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="card stack">
          <div className="card-title">O serviço</div>

          <div className="f-field">
            <label htmlFor="co-title">Título</label>
            <input
              id="co-title"
              className="f-input"
              name="title"
              maxLength={255}
              placeholder="Ex.: Pintar sala e dois quartos"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="f-field">
            <label htmlFor="co-category">Categoria</label>
            <select id="co-category" className="f-select" name="category" value={form.category} onChange={handleChange} required>
              <option value="">Selecione uma categoria</option>
              {categories.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="f-field">
            <label htmlFor="co-desc">Descrição</label>
            <textarea
              id="co-desc"
              className="f-textarea"
              name="description"
              placeholder="Descreva o que precisa ser feito, medidas, materiais, condições do local e qualquer detalhe importante."
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="f-grid f-grid-2">
            <div className="f-field">
              <label htmlFor="co-budget">Orçamento de referência</label>
              <input
                id="co-budget"
                className="f-input"
                name="budget"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={budgetPreview}
                onChange={handleChange}
                required
              />
              <span className="f-hint">Serve de referência para os profissionais. As propostas podem variar.</span>
            </div>

            <div className="f-field">
              <label htmlFor="co-deadline">Prazo desejado</label>
              <div className="co-deadline">
                <input
                  id="co-deadline"
                  className="f-input"
                  name="deadline"
                  type="number"
                  min={1}
                  max={365}
                  value={form.deadline}
                  onChange={handleChange}
                  required
                />
                <span>dias</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card stack">
          <div className="card-title">Onde será feito</div>

          <div className="f-grid f-grid-2">
            <div className="f-field">
              <label htmlFor="co-cep">CEP</label>
              <input
                id="co-cep"
                className="f-input"
                name="zip_code"
                inputMode="numeric"
                placeholder="00000-000"
                value={form.zip_code}
                onChange={handleChange}
                onBlur={handleCepBlur}
              />
              <span className="f-hint">
                {cepLoading ? (
                  'Buscando endereço...'
                ) : (
                  <>
                    <MapPin size={12} /> Preenchemos o resto pra você
                  </>
                )}
              </span>
            </div>

            <div className="f-field">
              <label htmlFor="co-number">Número</label>
              <input
                id="co-number"
                className="f-input"
                name="number"
                placeholder="123"
                value={form.number}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="f-field">
            <label htmlFor="co-street">Rua</label>
            <input
              id="co-street"
              className="f-input"
              name="street"
              placeholder="Nome da rua"
              value={form.street}
              onChange={handleChange}
            />
          </div>

          <div className="f-grid f-grid-2">
            <div className="f-field">
              <label htmlFor="co-neighborhood">Bairro</label>
              <input
                id="co-neighborhood"
                className="f-input"
                name="neighborhood"
                placeholder="Bairro"
                value={form.neighborhood}
                onChange={handleChange}
              />
            </div>

            <div className="f-field">
              <label htmlFor="co-complement">
                Complemento <span className="f-optional">(opcional)</span>
              </label>
              <input
                id="co-complement"
                className="f-input"
                name="complement"
                placeholder="Apto, bloco, referência"
                value={form.complement}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="f-grid f-grid-2">
            <div className="f-field">
              <label htmlFor="co-city">Cidade</label>
              <input
                id="co-city"
                className="f-input"
                name="city"
                placeholder="Cidade"
                value={form.city}
                onChange={handleChange}
              />
            </div>

            <div className="f-field">
              <label htmlFor="co-state">Estado</label>
              <input
                id="co-state"
                className="f-input"
                name="state"
                maxLength={2}
                placeholder="BA"
                value={form.state}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="card stack">
          <div>
            <div className="card-title">Fotos e documentos</div>
            <p className="card-sub">
              Até {MAX_FILES} arquivos de {MAX_FILE_MB} MB. Fotos do local ajudam muito na precisão das propostas.
            </p>
          </div>

          <input
            ref={fileInput}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFiles}
            hidden
          />

          <button type="button" className="f-ghost" onClick={() => fileInput.current?.click()} disabled={files.length >= MAX_FILES}>
            <Paperclip size={16} />
            Anexar arquivos
          </button>

          {files.length > 0 && (
            <ul className="co-files">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`}>
                  <span className="co-file-name">{file.name}</span>
                  <button type="button" onClick={() => removeFile(index)} aria-label={`Remover ${file.name}`}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="submit" className="f-submit" disabled={submitting}>
          {submitting ? 'Salvando...' : editing ? 'Salvar alterações' : 'Publicar pedido'}
        </button>
      </form>
    </>
  );
}
