import { useState, type FormEvent } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { createStore } from "../lib/store";
import { api, ApiError } from "../lib/api";
import type { Address, SavedAddress } from "../lib/types";
import { Button, Card, Field, inputCls } from "./ui";

const useAddresses = createStore<SavedAddress>("addresses");

const emptyAddress: Address = { fullName: "", email: "", line1: "", city: "", state: "", pincode: "", phone: "" };

export function AddressBook() {
  const { items: addresses, refresh } = useAddresses();
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [form, setForm] = useState<Address>(emptyAddress);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function startNew() {
    setEditing(null);
    setForm(emptyAddress);
    setError("");
    setShowForm(true);
  }

  function startEdit(a: SavedAddress) {
    setEditing(a);
    setForm(a);
    setError("");
    setShowForm(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editing) await api.put(`/api/addresses/${editing.id}`, form);
      else await api.post("/api/addresses", form);
      setShowForm(false);
      void refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "couldn't save that address");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await api.del(`/api/addresses/${id}`);
    void refresh();
  }

  async function makeDefault(a: SavedAddress) {
    await api.put(`/api/addresses/${a.id}`, { ...a, isDefault: true });
    void refresh();
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold">Saved addresses</h2>
        {!showForm && (
          <Button variant="secondary" onClick={startNew} className="!px-3 !py-1.5 text-xs">
            <Plus size={14} /> Add address
          </Button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={save} className="space-y-3 max-w-lg">
          <Field label="Full name">
            <input required className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input required className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Address line">
            <input required className={inputCls} value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="City">
              <input required className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="State">
              <input required className={inputCls} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </Field>
            <Field label="Pincode">
              <input required className={inputCls} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            </Field>
          </div>
          {error && <p className="text-sm text-(--color-danger)">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save address"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-(--color-muted)">No saved addresses yet — add one to speed up checkout.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-xl border border-(--color-border) p-3.5 text-sm relative">
              {a.isDefault && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-semibold text-(--color-accent-dark)">
                  <Star size={11} className="fill-current" /> default
                </span>
              )}
              <p className="flex items-center gap-1.5 font-semibold">
                <MapPin size={14} className="text-(--color-muted)" /> {a.fullName}
              </p>
              <p className="text-(--color-muted) mt-1">
                {a.line1}, {a.city}, {a.state} {a.pincode}
              </p>
              <p className="text-(--color-muted)">{a.phone}</p>
              <div className="flex items-center gap-3 mt-2.5">
                <button type="button" onClick={() => startEdit(a)} className="flex items-center gap-1 text-xs font-semibold text-(--color-ink) hover:text-(--color-accent-dark)">
                  <Pencil size={12} /> Edit
                </button>
                {!a.isDefault && (
                  <button type="button" onClick={() => void makeDefault(a)} className="text-xs font-semibold text-(--color-ink) hover:text-(--color-accent-dark)">
                    Make default
                  </button>
                )}
                <button type="button" onClick={() => void remove(a.id)} className="flex items-center gap-1 text-xs font-semibold text-(--color-danger) hover:opacity-80">
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
