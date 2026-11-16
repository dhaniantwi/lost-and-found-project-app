import React, { useEffect, useState } from 'react';
import { ItemCategory, ItemReport, ItemType } from '../types';
import { useApp } from '../context/AppContext';
import { ITEM_CATEGORIES, UCC_LOCATIONS } from '../data/seedData';
import { X, Upload, AlertCircle, CheckCircle2, Image as ImageIcon, Video } from 'lucide-react';

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
  const [rewardCommitmentConfirmed, setRewardCommitmentConfirmed] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const urls = mediaFiles.map((file) => URL.createObjectURL(file));
    setMediaPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [mediaFiles]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen || !currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    if (!selected.length) return;

    const nextFiles = [...mediaFiles];
    let uploadError = '';
    for (const file of selected) {
      if (nextFiles.length >= 2) {
        uploadError = 'You can upload a maximum of two files per report.';
        break;
      }
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || ['jpg', 'jpeg', 'png', 'webp'].includes(extension);
      const isVideo = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type) || ['mp4', 'webm', 'mov'].includes(extension);
      if (!isImage && !isVideo) {
        uploadError = 'Choose JPG, PNG, WebP, MP4, WebM, or MOV files.';
        continue;
      }
      if (isImage && file.size > 5 * 1024 * 1024) {
        uploadError = 'Each photo must be no larger than 5MB.';
        continue;
      }
      if (isVideo && file.size > 20 * 1024 * 1024) {
        uploadError = 'Each video must be no larger than 20MB.';
        continue;
      }
      nextFiles.push(file);
    }
    setMediaFiles(nextFiles);
    setErrors((current) => ({ ...current, media: uploadError }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Item title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!color.trim()) newErrors.color = 'Color is required';
    if (!dateEvent) newErrors.dateEvent = 'Date is required';
    if (type === 'lost' && rewardOffered.trim() && Number(rewardOffered) <= 0) newErrors.reward = 'Enter a valid reward amount greater than zero.';
    if (type === 'lost' && rewardOffered.trim() && !rewardCommitmentConfirmed) newErrors.reward = 'Please confirm the reward commitment or remove the reward amount.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validate()) return;
    if (!currentUser) { setErrors({ submit: 'Sign in before submitting a report.' }); return; }

    setIsSubmitting(true);
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
      rewardOffered: type === 'lost' && rewardOffered.trim() ? `GH₵ ${rewardOffered.trim()}` : undefined,
      rewardCommitmentConfirmed: type === 'lost' && Boolean(rewardOffered.trim()) && rewardCommitmentConfirmed,
      mediaFiles,
      reporterName: currentUser.fullName,
      reporterStudentId: currentUser.studentId,
      reporterEmail: currentUser.email,
      reporterPhone: currentUser.phone,
      reporterHall: currentUser.hallOfResidence
      });
      setMediaFiles([]);
      onClose();
    } catch (error: any) {
      const message = error?.message === 'Failed to fetch'
        ? 'The connection to CampusFind was interrupted while uploading your photo or saving the report. Your details are still here. Please check your internet connection and try again.'
        : error?.message || 'Unable to publish this report. Your details are still here; please try again.';
      setErrors((current) => ({ ...current, submit: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-950/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[96dvh] sm:max-h-[92vh] overflow-y-auto overscroll-contain border border-slate-200 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 sticky top-0 bg-white z-20 shrink-0">
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
            disabled={isSubmitting}
            className="shrink-0 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5 min-w-0">
          {/* Report Type Selector (Segmented buttons) */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2 p-1.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('lost')}
              className={`w-full min-w-0 flex-1 py-3 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 text-center transition-all ${
                type === 'lost'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="min-w-0">I Lost Something (Report Lost)</span>
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
              <span className="min-w-0">I Found Something (Report Found)</span>
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
          <div className="grid grid-cols-1 gap-4">
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
                  Optional Voluntary Reward (Not Required)
                </label>
                <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-within:border-blue-900 focus-within:ring-2 focus-within:ring-blue-900/20">
                  <span className="flex items-center border-r border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600">GH₵</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rewardOffered}
                    onChange={(e) => {
                      const amount = e.target.value.replace(/[^0-9.]/g, '');
                      if (/^\d*\.?\d{0,2}$/.test(amount)) setRewardOffered(amount);
                    }}
                    placeholder="50.00"
                    aria-label="Optional reward amount in Ghana cedis"
                    className="w-full min-w-0 bg-transparent px-3.5 py-2 text-sm text-slate-900 outline-none"
                  />
                </div>
                {rewardOffered.trim() && (
                  <label className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-950">
                    <input
                      type="checkbox"
                      checked={rewardCommitmentConfirmed}
                      onChange={(e) => setRewardCommitmentConfirmed(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span><strong>I confirm this reward.</strong> I am the item owner and I commit to paying the stated reward directly to the finder after CampusFind verifies that my item has been returned. I understand CampusFind does not collect, hold, guarantee, or transfer this money.</span>
                  </label>
                )}
                {errors.reward && <p role="alert" className="mt-1 text-xs text-rose-600">{errors.reward}</p>}
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                  The finder should never pay to return or claim an item. Payment is made directly by the owner only after verified handover. CampusFind does not handle reward funds; disputes can be referred to an administrator for follow-up, but payment cannot be guaranteed by the platform.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Storage / Custody Location (Private) *
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
              Public Item Description *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe visible, non-sensitive features such as brand, model, colour, case, or visible wear. Do not include secret serial numbers, student IDs, phone numbers, or private contents."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-900"
            />
            {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description}</p>}
          </div>

          {/* Confidential Ownership Details (Private) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Distinctive Ownership Marks (Used for Verification)
            </label>
            <input
              type="text"
              value={distinctMarks}
              onChange={(e) => setDistinctMarks(e.target.value)}
              placeholder="Add details only the genuine owner should know, such as a hidden mark, serial number, engraving, or contents. These details are not shown in the public catalogue."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Administrators compare this during claim verification to prevent fraudulent pickups.
            </p>
          </div>

          {/* Item Media Upload */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Item Photos or Video <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Add up to two files. You can upload two photos, two videos, or one of each. One file is completely fine.
              </p>
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                Do not upload student ID cards, bank cards, passports, or documents showing personal information. Uploaded media is private and visible only to the report owner and authorized CampusFind administrators.
              </p>
            </div>

            {mediaFiles.length > 0 && (
              <div className={`grid gap-3 ${mediaFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {mediaFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
                    <div className="aspect-video w-full flex items-center justify-center">
                      {file.type.startsWith('video/') ? (
                        <video
                          src={mediaPreviews[index]}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={mediaPreviews[index]}
                          alt={`Item preview ${index + 1}`}
                          className="w-full h-full object-contain bg-slate-100"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-white px-3 py-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-700">
                        {file.type.startsWith('video/') ? <Video className="w-3.5 h-3.5 shrink-0" /> : <ImageIcon className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{file.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setMediaFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                        className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                        aria-label={`Remove ${file.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mediaFiles.length < 2 && (
              <label className="flex min-h-28 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition-colors hover:border-blue-900 hover:bg-blue-50/40 cursor-pointer">
                <Upload className="mb-2 h-6 w-6 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">
                  {mediaFiles.length === 0 ? 'Choose a photo or video' : 'Add a second photo or video'}
                </span>
                <span className="mt-1 text-[11px] text-slate-400">
                  JPG, PNG, WebP · 5MB max per photo · MP4, WebM, MOV · 20MB max per video
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}

            {errors.media && <p className="text-xs text-rose-600" role="alert">{errors.media}</p>}
          </div>

          {/* Reporter Preview Info */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Reporting as:</span>{' '}
            {currentUser.fullName} ({currentUser.studentId}) · {currentUser.hallOfResidence}
          </div>

          {errors.submit && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{errors.submit}</p>}

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-5 py-3 sm:py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors disabled:opacity-60 disabled:cursor-wait ${
                type === 'lost'
                  ? 'bg-rose-700 hover:bg-rose-800'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {isSubmitting ? 'Submitting report…' : `Publish ${type === 'lost' ? 'Lost Item' : 'Found Item'} Report`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
