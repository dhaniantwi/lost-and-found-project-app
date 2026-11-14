import React, { useEffect, useState } from 'react';
import { ItemReport } from '../types';
import { useApp } from '../context/AppContext';
import { X, CheckCircle2, FileText, Upload, Film, Image as ImageIcon, Trash2, Clock } from 'lucide-react';

interface ClaimModalProps {
  item: ItemReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ item, isOpen, onClose }) => {
  const { currentUser, authUser, claims, submitClaim, deleteClaim } = useApp();

  const [proofDescription, setProofDescription] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!proofFile) {
      setProofPreviewUrl('');
      return;
    }
    const previewUrl = URL.createObjectURL(proofFile);
    setProofPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [proofFile]);

  if (!isOpen || !item || !currentUser) return null;

  const existingClaim = claims.find((claim) => claim.itemId === item.id && claim.claimantId === authUser?.id);

  const handleDeleteClaim = async () => {
    if (!existingClaim || existingClaim.status !== 'pending') return;
    if (!window.confirm('Delete your pending claim for this item? You will be able to submit a new claim later if needed.')) return;
    setIsDeleting(true);
    setError('');
    try {
      await deleteClaim(existingClaim.id);
    } catch (err: any) {
      setError(err?.message || 'Unable to delete your claim.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    const isVideo = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type);
    const isPdf = file.type === 'application/pdf';
    const maxSize = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024;

    if ((!isImage && !isVideo && !isPdf) || file.size > maxSize) {
      setError('Choose a JPG, PNG, WebP, PDF (max 5MB), or MP4, WebM, MOV video (max 20MB).');
      e.target.value = '';
      return;
    }

    setProofFile(file);
    setError('');
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofDescription.trim() || proofDescription.length < 15) {
      setError('Please provide sufficient proof details (at least 15 characters) describing distinctive marks, serial numbers, or contents.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must confirm under the student honor code that this item belongs to you.');
      return;
    }
    try {
      await submitClaim({
        itemId: item.id,
        itemTitle: item.title,
        itemCategory: item.category,
        itemCampusLocation: item.campusLocation,
        proofDescription: proofDescription.trim(),
        proofDocumentFile: proofFile || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Unable to submit your claim.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Submit Ownership Claim
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify possession through confidential details
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {existingClaim ? (
          <div className="p-6 space-y-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Claim already submitted
              </div>
              <p className="mt-2 text-xs leading-relaxed text-emerald-900">
                You have already submitted an ownership claim for <strong>{item.title}</strong>. You cannot submit another claim for this item while this claim exists.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Claim status</span>
                <span className="font-semibold capitalize">{existingClaim.status}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Submitted</span>
                <span>{new Date(existingClaim.submittedAt).toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block mb-1">Your proof details</span>
                <p className="whitespace-pre-wrap">{existingClaim.proofDescription}</p>
              </div>
              {existingClaim.adminNotes && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Security Desk response</span>
                  <p className="whitespace-pre-wrap">{existingClaim.adminNotes}</p>
                </div>
              )}
            </div>
            {existingClaim.status === 'pending' ? (
              <button type="button" onClick={handleDeleteClaim} disabled={isDeleting} className="w-full flex items-center justify-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Withdrawing claim…' : 'Delete My Claim'}
              </button>
            ) : (
              <p className="text-[11px] text-slate-500 flex items-start gap-2"><Clock className="w-4 h-4 shrink-0" />This claim has already been reviewed or collected and cannot be deleted here. Please contact the Security Desk if you need assistance.</p>
            )}
            {error && <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">{error}</div>}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg">Close</button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Item Summary Banner */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
            <div className="text-blue-900 font-semibold mb-0.5">Target Found Item:</div>
            <div className="text-slate-800 font-medium text-sm">{item.title}</div>
            <div className="text-slate-500 text-[11px] mt-1">
              Found at: {item.campusLocation} · Collection instructions will be provided if your claim is approved.
            </div>
          </div>

          {/* Claimant Identity Preview */}
          <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
            <div>
              <span className="text-slate-400">Claimant:</span>{' '}
              <span className="font-semibold text-slate-900">{currentUser.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400">ID:</span>{' '}
              <span className="font-mono text-slate-900">{currentUser.studentId}</span>
            </div>
            <div>
              <span className="text-slate-400">Hall:</span> {currentUser.hallOfResidence}
            </div>
            <div>
              <span className="text-slate-400">Contact:</span>{' '}
              <span className="font-mono">{currentUser.phone}</span>
            </div>
          </div>

          {/* Confidential Proof Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Confidential Proof of Ownership *
            </label>
            <textarea
              rows={4}
              value={proofDescription}
              onChange={(e) => {
                setProofDescription(e.target.value);
                if (error) setError('');
              }}
              placeholder="Describe secret identifying features only the real owner would know: e.g. serial number, specific engraving, hidden stickers, description of wallpaper/lockscreen, exact contents inside pockets..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-900 leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Your proof is private and visible only to you and authorized administrators. Do not upload ID cards or documents containing unnecessary personal information.
            </p>
          </div>

          {/* Optional Proof Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Supporting Proof Attachment (Optional)
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer transition-colors text-xs text-slate-600">
              <Upload className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-slate-700 truncate">
                  {proofFile ? proofFile.name : 'Upload a photo, video, or receipt'}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  Images/PDF up to 5MB · MP4, WebM, MOV videos up to 20MB
                </span>
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm,video/quicktime"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {proofFile && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 min-w-0">
                    {proofFile.type.startsWith('video/') ? <Film className="w-4 h-4 shrink-0" /> : proofFile.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 shrink-0" /> : <FileText className="w-4 h-4 shrink-0" />}
                    <span className="truncate">{proofFile.name}</span>
                  </div>
                  <button type="button" onClick={() => setProofFile(null)} className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                    Remove
                  </button>
                </div>
                {proofFile.type.startsWith('video/') && proofPreviewUrl && (
                  <video src={proofPreviewUrl} controls playsInline className="w-full max-h-56 rounded-lg bg-black" />
                )}
                {proofFile.type.startsWith('image/') && proofPreviewUrl && (
                  <img src={proofPreviewUrl} alt="Claim evidence preview" className="w-full max-h-56 rounded-lg object-contain bg-white" />
                )}
                {proofFile.type === 'application/pdf' && (
                  <p className="text-[11px] text-slate-500">PDF document selected and ready to upload.</p>
                )}
              </div>
            )}
          </div>

          {/* Honor Code Checkbox */}
          <div className="flex items-start gap-2.5 pt-2">
            <input
              type="checkbox"
              id="honorCode"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (error) setError('');
              }}
              className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
            />
            <label htmlFor="honorCode" className="text-xs text-slate-600 cursor-pointer leading-tight">
              I certify under UCC Student Regulations that I am the rightful owner. False claims constitute academic disciplinary misconduct.
            </label>
          </div>

          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
            >
              Submit Claim
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
