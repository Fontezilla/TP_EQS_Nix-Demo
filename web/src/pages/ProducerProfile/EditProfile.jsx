// O produtor edita a sua página pública; o local escolhe-se com um clique no mapa
import { useEffect, useState } from 'react';
import Modal from '../../components/Modal/Modal.jsx';
import MapView from '../../components/MapView/MapView.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { updateProducerPage } from '../../api/products.js';
import { MUNICIPALITIES } from '../../utils/format.js';

const initialForm = (p) => ({
  name: p.name,
  description: p.producer.description || '',
  city: p.producer.city || '',
  address: p.producer.address || '',
  location: p.producer.location
});

export default function EditProfile({ open, producer, onClose, onSaved }) {
  const { token, updateUser } = useAuth();
  const [form, setForm] = useState(() => initialForm(producer));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Cada vez que abre, começa com os dados atuais
  useEffect(() => { if (open) { setForm(initialForm(producer)); setError(''); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function save() {
    setError('');
    setSaving(true);
    try {
      await updateProducerPage(form, token);
      updateUser({ name: form.name });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Editar página pública" open={open} onClose={onClose} onSubmit={save} wide
      footer={<>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'A guardar…' : 'Guardar alterações'}</button>
      </>}>
      <div className="row g-3">
        <div className="col-md-6 d-grid gap-3 align-content-start">
          <div>
            <label className="form-label" htmlFor="e-name">Nome da exploração</label>
            <input id="e-name" className="form-control" required maxLength={80} value={form.name} onChange={change('name')} />
          </div>
          <div>
            <label className="form-label" htmlFor="e-desc">Apresentação</label>
            <textarea id="e-desc" className="form-control" rows="5" maxLength={1000} value={form.description} onChange={change('description')} />
          </div>
          <div>
            <label className="form-label" htmlFor="e-city">Concelho</label>
            <select id="e-city" className="form-select" required value={form.city} onChange={change('city')}>
              <option value="" disabled>Escolha o concelho</option>
              {MUNICIPALITIES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="e-address">Morada de levantamento</label>
            <input id="e-address" className="form-control" value={form.address} onChange={change('address')} />
          </div>
        </div>
        <div className="col-md-6">
          <span className="form-label d-block" id="e-map">Local no mapa</span>
          <MapView position={form.location} label="Clique no mapa para marcar o local de levantamento"
            onPick={(location) => setForm((f) => ({ ...f, location }))} />
          <p className="form-text">Clique no mapa para marcar o local de levantamento.</p>
        </div>
      </div>
      {error && <div className="alert alert-danger py-2 small mt-3 mb-0" role="alert">{error}</div>}
    </Modal>
  );
}
