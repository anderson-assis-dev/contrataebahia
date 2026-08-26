import React, { useEffect, useState } from 'react';
import { AlertCircle, ImagePlus, Pause, Play, Plus, Trash2, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { createService, deleteService, listMyServices, updateService, listCategories } from '../../services/catalog';
import { apiError } from '../../services/http';
import { STATIC_CATEGORIES } from '../../data/categories';
import { formatMoney, onlyDigits } from '../../utils/format';
import '../forms.css';
import '../ui.css';
import './ServiceCatalog.css';

const FALLBACK_LABELS = STATIC_CATEGORIES.map((c) => c.label);
const EMPTY = { title: '', description: '', price: '', category: '', status: 'active' };
const STATUS_LABEL = { active: 'Ativo', inactive: 'Inativo', paused: 'Pausado' };
const STATUS_BADGE = { active: 'completed', paused: 'stopped', inactive: 'cancelled' };

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ServiceCatalog() {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState(FALLBACK_LABELS);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const json = await listMyServices();
      setServices(json?.data || []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    listCategories(60)
      .then((json) => {
        const labels = (json?.data || []).map((c) => c.label).filter(Boolean);
        if (labels.length) setCategories(labels);
      })
      .catch(() => {});
  }, []);

  const openNew = () => {
    setEditing('new');
    setForm(EMPTY);
    setImages([]);
    setError('');
  };

  const openEdit = (service) => {
    setEditing(service.id);
    setForm({
      title: service.title || '',
      description: service.description || '',
      price: String(Math.round(Number(service.price || 0) * 100)),
      category: service.category || '',
      status: service.status || 'active',
    });
    setImages(Array.isArray(service.images) ? service.images : []);
    setError('');
  };

  const closeForm = () => {
    setEditing(null);
    setForm(EMPTY);
    setImages([]);
    setError('');
  };

  const handleImages = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const room = Math.max(0, 5 - images.length);
    const picked = files.slice(0, room);
    try {
      const next = await Promise.all(picked.map(fileToDataUrl));
      setImages((current) => [...current, ...next].slice(0, 5));
    } catch {
      toast.error('Não foi possível ler uma das imagens.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const price = Number(onlyDigits(form.price)) / 100;
    if (price <= 0) {
      setError('Informe o preço do serviço.');
      return;
    }
    if (!form.category) {
      setError('Escolha a categoria.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price,
        category: form.category,
        status: form.status,
        images,
      };
      const json = editing === 'new' ? await createService(payload) : await updateService(editing, payload);
      if (json?.success) {
        toast.success(editing === 'new' ? 'Serviço publicado no seu catálogo.' : 'Serviço atualizado.');
        closeForm();
        await load();
        return;
      }
      setError(json?.message || 'Não foi possível salvar o serviço.');
    } catch (err) {
      setError(apiError(err, 'Não foi possível salvar o serviço.'));
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (service) => {
    const next = service.status === 'active' ? 'inactive' : 'active';
    try {
      await updateService(service.id, {
        title: service.title,
        description: service.description,
        price: service.price,
        category: service.category,
        status: next,
        images: service.images || [],
      });
      setServices((list) => list.map((item) => (item.id === service.id ? { ...item, status: next } : item)));
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível alterar o status.'));
    }
  };

  const handleDelete = async (service) => {
    if (!window.confirm(`Excluir "${service.title}" do catálogo?`)) return;
    try {
      await deleteService(service.id);
      toast.info('Serviço excluído.');
      setServices((list) => list.filter((item) => item.id !== service.id));
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível excluir.'));
    }
  };

  const pricePreview = Number(onlyDigits(form.price)) / 100;

  return (
    <section>
      <div className="sc-head">
        <h2 className="card-title">Catálogo</h2>
        {editing == null && (
          <button type="button" className="sc-add" onClick={openNew}>
            <Plus size={14} />
            Novo serviço
          </button>
        )}
      </div>
      <p className="page-sub" style={{ marginTop: -8, marginBottom: 14 }}>
        O que você oferece fica visível no seu perfil público.
      </p>

      {editing != null && (
        <form className="card stack" onSubmit={handleSubmit} style={{ marginBottom: 14 }}>
          <div className="card-title">{editing === 'new' ? 'Novo serviço' : 'Editar serviço'}</div>
          {error && (
            <div className="f-alert f-alert-err">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          <div className="f-field">
            <label htmlFor="sc-title">Título</label>
            <input
              id="sc-title"
              className="f-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex.: Instalação de ar-condicionado split"
              required
            />
          </div>
          <div className="f-field">
            <label htmlFor="sc-desc">Descrição</label>
            <textarea
              id="sc-desc"
              className="f-textarea"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="O que está incluso, o que o cliente precisa preparar..."
              required
            />
          </div>
          <div className="f-grid f-grid-2">
            <div className="f-field">
              <label htmlFor="sc-price">Preço de referência</label>
              <input
                id="sc-price"
                className="f-input"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={pricePreview > 0 ? formatMoney(pricePreview) : ''}
                onChange={(e) => setForm((f) => ({ ...f, price: onlyDigits(e.target.value).slice(0, 10) }))}
                required
              />
            </div>
            <div className="f-field">
              <label htmlFor="sc-cat">Categoria</label>
              <select
                id="sc-cat"
                className="f-select"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                required
              >
                <option value="">Selecione</option>
                {categories.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="f-field">
            <label htmlFor="sc-status">Status</label>
            <select
              id="sc-status"
              className="f-select"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
          <div className="f-field">
            <label htmlFor="sc-imgs">Fotos (até 5)</label>
            <input id="sc-imgs" type="file" accept="image/*" multiple className="sc-file" onChange={handleImages} />
            <label htmlFor="sc-imgs" className="f-ghost">
              <ImagePlus size={16} />
              Adicionar fotos
            </label>
            {images.length > 0 && (
              <div className="sc-thumbs">
                {images.map((src, index) => (
                  <span key={`${index}-${src.slice(-12)}`} className="sc-thumb">
                    <img src={src} alt="" />
                    <button type="button" aria-label="Remover foto" onClick={() => setImages((list) => list.filter((_, i) => i !== index))}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="f-submit" disabled={busy}>
            {busy ? 'Salvando...' : 'Salvar serviço'}
          </button>
          <button type="button" className="f-ghost" onClick={closeForm}>
            Cancelar
          </button>
        </form>
      )}

      {loading ? (
        <div className="stack">
          <div className="skel" style={{ height: 88 }} />
          <div className="skel" style={{ height: 88 }} />
        </div>
      ) : services.length === 0 && editing == null ? (
        <div className="empty">
          <span className="empty-ico">
            <Plus size={24} />
          </span>
          <strong>Nenhum serviço no catálogo</strong>
          <p>Cadastre o que você faz. Clientes veem isso no seu perfil quando te encontram na busca.</p>
          <button type="button" className="btn-primary" onClick={openNew}>
            Cadastrar serviço
          </button>
        </div>
      ) : (
        <div className="stack">
          {services.map((service) => (
            <article key={service.id} className="sc-item">
              {service.images?.[0] && <img src={service.images[0]} alt="" className="sc-cover" />}
              <div className="sc-body">
                <div className="sc-top">
                  <h3>{service.title}</h3>
                  <span className={`badge badge-${STATUS_BADGE[service.status] || 'stopped'}`}>
                    {STATUS_LABEL[service.status] || service.status}
                  </span>
                </div>
                <p>{service.description}</p>
                <div className="meta">
                  <span className="meta-item sc-price">{formatMoney(service.price)}</span>
                  <span className="meta-item">{service.category}</span>
                </div>
                <div className="sc-actions">
                  <button type="button" className="f-ghost" onClick={() => openEdit(service)}>
                    Editar
                  </button>
                  <button type="button" className="f-ghost" onClick={() => handleToggle(service)}>
                    {service.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                    {service.status === 'active' ? 'Pausar' : 'Ativar'}
                  </button>
                  <button type="button" className="f-ghost od-danger" onClick={() => handleDelete(service)}>
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
