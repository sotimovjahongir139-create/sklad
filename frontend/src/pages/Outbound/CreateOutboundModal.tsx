import { useState, useRef } from 'react';
import { X, Upload, Check } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSave: () => void;
}

const PRESET_COLORS = [
  { label: 'Qora',       hex: '#111111' },
  { label: 'Oq',         hex: '#f5f5f5' },
  { label: 'Qizil',      hex: '#dc2626' },
  { label: "Ko'k",       hex: '#2563eb' },
  { label: 'Yashil',     hex: '#16a34a' },
  { label: 'Sariq',      hex: '#ca8a04' },
  { label: 'Kulrang',    hex: '#6b7280' },
  { label: "To'q sariq", hex: '#ea580c' },
  { label: 'Jigarrang',  hex: '#92400e' },
  { label: 'Pushti',     hex: '#db2777' },
  { label: 'Binafsha',   hex: '#7c3aed' },
  { label: 'Moviy',      hex: '#0891b2' },
];

const today = () => new Date().toISOString().split('T')[0];

export default function CreateOutboundModal({ onClose, onSave }: Props) {
  const [modelName, setModelName]         = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [customColor, setCustomColor]     = useState<string | null>(null);
  const [date, setDate]                   = useState(today());
  const [quantity, setQuantity]           = useState<number | ''>('');
  const [note, setNote]                   = useState('');
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState(false);
  const colorPickerRef                    = useRef<HTMLInputElement>(null);

  const activeColor = customColor ?? selectedColor;

  const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
    setSelectedColor(null);
  };

  const handlePresetClick = (hex: string) => {
    setSelectedColor(hex);
    setCustomColor(null);
  };

  const handleClear = () => {
    setModelName('');
    setSelectedColor(null);
    setCustomColor(null);
    setDate(today());
    setQuantity('');
    setNote('');
    setError('');
    setSuccess(false);
  };

  const handleSave = () => {
    setError('');
    if (!modelName.trim()) { setError('Model nomini kiriting!'); return; }
    if (!quantity || Number(quantity) < 1) { setError('Miqdorni kiriting!'); return; }
    setSuccess(true);
    setTimeout(() => { onSave(); }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
      <div className="w-full max-w-md rounded-xl overflow-hidden bg-white">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: '#1a2332' }}>
          <div className="flex items-center gap-2">
            <Upload size={18} color="#ffffff" />
            <span className="text-white font-semibold text-base">Yangi chiqim buyurtmasi</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 transition-opacity">
            <X size={18} color="#ffffff" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Model nomi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model nomi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Masalan: Nike Air Max 90"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Rang tanlash */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rang</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => handlePresetClick(c.hex)}
                  title={c.label}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{
                    backgroundColor: c.hex,
                    border: selectedColor === c.hex ? '3px solid #2563eb' : '2px solid #d1d5db',
                    outline: selectedColor === c.hex ? '2px solid #93c5fd' : 'none',
                    outlineOffset: '1px',
                  }}
                />
              ))}

              <button
                type="button"
                onClick={() => colorPickerRef.current?.click()}
                className="px-3 h-8 rounded-full text-xs font-medium border border-gray-300 hover:border-blue-400 bg-gray-50 text-gray-700 transition-colors whitespace-nowrap"
              >
                Boshqa rang
              </button>
              <input
                ref={colorPickerRef}
                type="color"
                className="sr-only"
                onChange={handleCustomColor}
                defaultValue="#000000"
              />
            </div>

            {customColor && (
              <div className="mt-2 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: customColor }} />
                <span className="text-xs text-gray-600">Maxsus rang: {customColor}</span>
              </div>
            )}
          </div>

          {/* Sana */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sana</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Miqdor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miqdor <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qo'shimcha izoh..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <Check size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800 space-y-0.5">
                <p className="font-semibold">Muvaffaqiyatli saqlandi!</p>
                <p>Model: <span className="font-medium">{modelName}</span></p>
                {activeColor && (
                  <p className="flex items-center gap-1.5">
                    Rang:
                    <span className="inline-block w-3 h-3 rounded-full border border-green-300" style={{ backgroundColor: activeColor }} />
                    <span className="font-medium">{activeColor}</span>
                  </p>
                )}
                <p>Sana: <span className="font-medium">{date}</span></p>
                <p>Miqdor: <span className="font-medium">{quantity}</span></p>
                {note && <p>Izoh: <span className="font-medium">{note}</span></p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 flex gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={success}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#2563eb' }}
          >
            Saqlash
          </button>
        </div>

      </div>
    </div>
  );
}
