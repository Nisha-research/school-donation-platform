import { useState, useEffect } from 'react';
import type { SchoolNeed, Category, Priority } from '@/lib/types';
import { createNeed, updateNeed } from '@/lib/data';
import { X, Loader2, PackagePlus, Pencil } from 'lucide-react';

interface NeedFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingNeed?: SchoolNeed | null;
}

export function NeedFormModal({ open, onClose, onSaved, editingNeed }: NeedFormModalProps) {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<Category>('Stationery');
  const [quantityRequired, setQuantityRequired] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingNeed) {
      setItemName(editingNeed.item_name);
      setCategory(editingNeed.category);
      setQuantityRequired(String(editingNeed.quantity_required));
      setPriority(editingNeed.priority);
      setDescription(editingNeed.description ?? '');
    } else {
      setItemName('');
      setCategory('Stationery');
      setQuantityRequired('');
      setPriority('Medium');
      setDescription('');
    }
    setError(null);
  }, [editingNeed, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const qty = parseInt(quantityRequired, 10);
    if (!itemName.trim()) return setError('Item name is required.');
    if (!quantityRequired || isNaN(qty) || qty < 1) return setError('Quantity must be at least 1.');

    setSaving(true);
    try {
      const payload = {
        item_name: itemName.trim(),
        category,
        quantity_required: qty,
        priority,
        description: description.trim() || undefined,
      };
      if (editingNeed) {
        await updateNeed(editingNeed.id, payload);
      } else {
        await createNeed(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save need.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-scale-in rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy-900 dark:border dark:border-navy-700">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-navy-900 dark:text-navy-100 flex items-center gap-2">
            {editingNeed ? <><Pencil className="h-5 w-5" /> Edit Need</> : <><PackagePlus className="h-5 w-5" /> Add New Need</>}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-navy-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-error-50 p-3 text-sm text-error-700 dark:bg-error-900/30 dark:text-error-400">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy-800">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-navy-900 placeholder-slate-400 focus:border-cta-500 focus:ring-1 focus:ring-cta-500"
              placeholder="e.g. Notebooks"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-navy-800 dark:text-navy-200">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-navy-900 focus:border-cta-500 focus:ring-1 focus:ring-cta-500 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
              >
                <option>Stationery</option>
                <option>Bags</option>
                <option>Books</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-800 dark:text-navy-200">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-navy-900 focus:border-cta-500 focus:ring-1 focus:ring-cta-500 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-800 dark:text-navy-200">Quantity Required</label>
            <input
              type="number"
              min={1}
              value={quantityRequired}
              onChange={(e) => setQuantityRequired(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-navy-900 placeholder-slate-400 focus:border-cta-500 focus:ring-1 focus:ring-cta-500 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
              placeholder="e.g. 40"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-800 dark:text-navy-200">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-navy-900 placeholder-slate-400 focus:border-cta-500 focus:ring-1 focus:ring-cta-500 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
              placeholder="Brief description of the need..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-navy-600 dark:text-slate-300 dark:hover:bg-navy-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cta-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-cta-600 hover:shadow-lg disabled:opacity-50"
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : editingNeed ? 'Save Changes' : 'Add Need'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
