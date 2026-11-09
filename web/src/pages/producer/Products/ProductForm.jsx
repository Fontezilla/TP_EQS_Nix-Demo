// Criar ou editar um produto, com fotografia opcional (sem foto, mostra-se a ilustração da categoria)
import { useEffect, useState } from 'react';
import Modal from '../../../components/Modal/Modal.jsx';
import CategoryTile from '../../../components/CategoryTile/CategoryTile.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { createProduct, updateProduct, uploadImage, deleteImage } from '../../../api/products.js';
import { CATEGORIES, CATEGORY_LABELS, SEASONS, SEASON_LABELS } from '../../../utils/labels.js';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

const EMPTY = { name: '', description: '', category: 'fruit', price: '', unit: 'kg', stock: '', minStock: 10, organic: false, seasons: [] };

export default function ProductForm({ open, product, onClose, onSaved }) {
  const { token } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState(null); // { file, preview } ou null
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(product ? { ...EMPTY, ...product, description: product.description || '' } : EMPTY);
    setPhoto(null);
    setRemovePhoto(false);
    setError('');
  }, [open, product]);

  useEffect(() => () => photo && URL.revokeObjectURL(photo.preview), [photo]);

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const toggleSeason = (s) => setForm({ ...form, seasons: form.seasons.includes(s) ? form.seasons.filter((x) => x !== s) : [...form.seasons, s] });

  function pickPhoto(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError('A fotografia tem de ser JPEG, PNG ou WebP.');
    if (file.size > MAX_BYTES) return setError('A fotografia não pode ter mais de 5 MB.');
    setError('');
    setRemovePhoto(false);
    setPhoto({ file, preview: URL.createObjectURL(file) });
  }

  async function save() {
    setError('');
    setSaving(true);
    const body = {
      name: form.name, description: form.description, category: form.category, unit: form.unit,
      price: Number(form.price), stock: Number(form.stock), minStock: Number(form.minStock),
      organic: form.organic, seasons: form.seasons
    };
    try {
      const p = product ? await updateProduct(product._id, body, token) : await createProduct(body, token);
      if (photo) await uploadImage(p._id, photo.file, token);
      else if (removePhoto) await deleteImage(p._id, token);
      onSaved(product ? 'updated' : 'created');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const image = photo?.preview || (!removePhoto && product?.imageUrl);

  return (
    <Modal title={product ? `Editar ${product.name}` : 'Novo produto'} open={open} onClose={onClose} onSubmit={save} wide
      footer={<>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'A guardar…' : product ? 'Guardar alterações' : 'Criar produto'}</button>
      </>}>
      <div className="row g-3">
        <div className="col-md-4">
          <span className="form-label d-block">Fotografia</span>
          <label htmlFor="photo" className="product-photo">
            <CategoryTile category={form.category} imageUrl={image} alt="Fotografia do produto" />
            <span className="product-photo__action"><i className="bi bi-camera" aria-hidden="true" />{image ? 'Trocar foto' : 'Carregar foto'}</span>
          </label>
          <input id="photo" type="file" accept={TYPES.join(',')} className="visually-hidden" onChange={pickPhoto} />
          <p className="form-text mb-1">JPEG, PNG ou WebP até 5 MB. Sem foto, mostra-se a ilustração da categoria.</p>
          {image && (
            <button type="button" className="btn btn-link btn-sm p-0 muted" onClick={() => { setPhoto(null); setRemovePhoto(true); }}>
              Tirar a fotografia
            </button>
          )}
        </div>

        <div className="col-md-8">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label" htmlFor="p-name">Nome</label>
              <input id="p-name" className="form-control" required maxLength={80} value={form.name} onChange={change('name')} />
            </div>
            <div className="col-sm-6">
              <label className="form-label" htmlFor="p-cat">Categoria</label>
              <select id="p-cat" className="form-select" value={form.category} onChange={change('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div className="col-sm-3 col-6">
              <label className="form-label" htmlFor="p-price">Preço (€)</label>
              <input id="p-price" type="number" inputMode="decimal" step="0.01" min="0" className="form-control" required value={form.price} onChange={change('price')} />
            </div>
            <div className="col-sm-3 col-6">
              <label className="form-label" htmlFor="p-unit">Unidade</label>
              <input id="p-unit" className="form-control" required placeholder="kg, unid., 500 g…" value={form.unit} onChange={change('unit')} />
            </div>
            <div className="col-6">
              <label className="form-label" htmlFor="p-stock">Stock</label>
              <input id="p-stock" type="number" min="0" step="1" className="form-control" required value={form.stock} onChange={change('stock')} />
            </div>
            <div className="col-6">
              <label className="form-label" htmlFor="p-min">Avisar abaixo de</label>
              <input id="p-min" type="number" min="0" step="1" className="form-control" value={form.minStock} onChange={change('minStock')} aria-describedby="p-min-help" />
              <div id="p-min-help" className="form-text">Aparece em "Stock baixo" no painel.</div>
            </div>
            <div className="col-12">
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" role="switch" id="p-organic" checked={form.organic} onChange={change('organic')} />
                <label className="form-check-label" htmlFor="p-organic">Produção biológica</label>
              </div>
            </div>
          </div>
        </div>

        <fieldset className="col-12">
          <legend className="form-label">Época</legend>
          <div className="d-flex flex-wrap gap-3">
            {SEASONS.map((s) => (
              <div className="form-check" key={s}>
                <input className="form-check-input" type="checkbox" id={`s-${s}`} checked={form.seasons.includes(s)} onChange={() => toggleSeason(s)} />
                <label className="form-check-label" htmlFor={`s-${s}`}>{SEASON_LABELS[s]}</label>
              </div>
            ))}
          </div>
        </fieldset>
        <div className="col-12">
          <label className="form-label" htmlFor="p-desc">Descrição <span className="muted fw-normal">(também serve para a pesquisa por ingrediente)</span></label>
          <textarea id="p-desc" className="form-control" rows="3" maxLength={1000} value={form.description} onChange={change('description')} />
        </div>
      </div>
      {error && <div className="alert alert-danger py-2 small mt-3 mb-0" role="alert">{error}</div>}
    </Modal>
  );
}
