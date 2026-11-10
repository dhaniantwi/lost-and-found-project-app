import React, { useState } from 'react';
import { ItemCategory, ItemReport, ItemType } from '../types';
import { useApp } from '../context/AppContext';
import { UCC_LOCATIONS } from '../data/seedData';
import { X, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ReportModalProps {
  initialType?: ItemType;
  isOpen: boolean;
  onClose: () => void;
}


export const ReportModal: React.FC<ReportModalProps> = ({
  initialType = 'lost',
  isOpen,
  onClose
}) => {
  const { currentUser, addItemReport } = useApp();

  const [type, setType] = useState<ItemType>(initialType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Student ID & Cards');
  const [campusLocation, setCampusLocation] = useState(UCC_LOCATIONS[0]);
  const [specificSpot, setSpecificSpot] = useState('');
  const [dateEvent, setDateEvent] = useState(new Date().toISOString().split('T')[0]);
  const [color, setColor] = useState('Black');
  const [description, setDescription] = useState('');
  const [distinctMarks, setDistinctMarks] = useState('');
  const [storageLocation, setStorageLocation] = useState('Central Security Post (North Gate)');
  const [rewardOffered, setRewardOffered] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen || !currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        setErrors((current) => ({ ...current, image: 'Choose a JPG, PNG, or WebP image no larger than 5MB.' }));
        return;
      }
      setErrors((current) => ({ ...current, image: '' }));
      const reader = new FileReader();
      reader.onload = () => { if (typeof reader.result === 'string') setImageUrl(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Item title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!color.trim()) newErrors.color = 'Color is required';
    if (!dateEvent) newErrors.dateEvent = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!currentUser) { setErrors({ submit: 'Sign in before submitting a report.' }); return; }

    try {
      await addItemReport({
      type,
      title: title.trim(),
      category,
      campusLocation,
      specificSpot: specificSpot.trim() || undefined,
      dateEvent,
      color: color.trim(),
      description: description.trim(),
      distinctMarks: distinctMarks.trim() || undefined,
      storageLocation: type === 'found' ? storageLocation.trim() : undefined,
      rewardOffered: type === 'lost' && rewardOffered.trim() ? rewardOffered.trim() : undefined,
      imageUrl: imageUrl || undefined,
      reporterName: currentUser.fullName,
      reporterStudentId: currentUser.studentId,
      reporterEmail: currentUser.email,
      reporterPhone: currentUser.phone,
      reporterHall: currentUser.hallOfResidence
      });
      onClose();
    } catch (error: any) {
      setErrors((current) => ({ ...current, submit: error?.message || 'Unable to publish this report.' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Submit Campus Report
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              University of Cape Coast Central Lost & Found Registry
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Report Type Selector (Segmented buttons) */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('lost')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                type === 'lost'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>I Lost Something (Report Lost)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('found')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                type === 'found'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Found Something (Report Found)</span>
            </button>
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item Title / Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Casio fx-991EX Calculator or UCC Student ID Card"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-900"
            />
            {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title}</p>}
          </div>

          {/* Category & Color Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-900"
              >
                {ITEM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Color *
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Black, Navy Blue, Brown, Silver"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-900"
              />
              {errors.color && <p className="text-xs text-rose-600 mt-1">{errors.color}</p>}
            </div>
          </div>

          {/* Campus Location & Specific Spot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                UCC Campus Location *
              </label>
              <select
                value={campusLocation}
                onChange={(e) => setCampusLocation(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-900"
              >
                {UCC_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Spot / Room / Hall Area
              </label>
              <input
                type="text"
                value={specificSpot}
                onChange={(e) => setSpecificSpot(e.target.value)}
                placeholder="e.g. SLT 1 Row 4 or Level 2 Carrel 15"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-900"
              />
            </div>
          </div>

          {/* Date Event */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date {type === 'lost' ? 'Lost' : 'Found'} *
              </label>
              <input
                type="date"
                value={dateEvent}
                onChange={(e) => setDateEvent(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-900 font-mono"
              />
              {errors.dateEvent && <p className="text-xs text-rose-600 mt-1">{errors.dateEvent}</p>}
            </div>

            {type === 'lost' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Reward Token
                </label>
                <input
                  type="text"
                  value={rewardOffered}
                  onChange={(e) => setRewardOffered(e.target.value)}
                  placeholder="e.g. GH₵ 50 airtime or gesture of gratitude"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-900"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Storage / Custody Location *
                </label>
                <input
                  type="text"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  placeholder="e.g. Central Security Post (North Gate) or Porters Lodge"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-900"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              General Description *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a clear description of the item including brand, model, case, visible wear, or lecture context..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-900"
            />
            {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description}</p>}
          </div>

          {/* Distinct Marks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Distinctive Ownership Marks (Used for Verification)
            </label>
            <input
              type="text"
              value={distinctMarks}
              onChange={(e) => setDistinctMarks(e.target.value)}
              placeholder="e.g. Scratch on top left, initials 'DA', stickers, specific lockscreen photo"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Administrators compare this during claim verification to prevent fraudulent pickups.
            </p>
          </div>

          {/* Photo Upload & Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Item Photograph (Optional but Recommended)
            </label>
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2.5 mb-3">Do not upload student ID cards, bank cards, passports, or documents showing personal information. Item photos may be visible to signed-in CampusFind users.</p>

            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden aspect-16/9 bg-slate-100 border border-slate-200 mb-3">
                <img
                  src={imageUrl}
                  alt="Item Preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded-md hover:bg-slate-900 text-xs"
                >
                  Remove Photo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-blue-900 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">
                    Click to browse or drop photo
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG or WebP · Maximum 5MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>


              </div>
            )}
          </div>

          {errors.image && <p className="text-xs text-rose-600 mt-2">{errors.image}</p>}

          {/* Reporter Preview Info */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Reporting as:</span>{' '}
            {currentUser.fullName} ({currentUser.studentId}) · {currentUser.hallOfResidence}
          </div>

          {errors.submit && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{errors.submit}</p>}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors ${
                type === 'lost'
                  ? 'bg-rose-700 hover:bg-rose-800'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              Publish {type === 'lost' ? 'Lost Item' : 'Found Item'} Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
