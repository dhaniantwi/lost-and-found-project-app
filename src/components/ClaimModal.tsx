import React, { useState } from 'react';
import { ItemReport } from '../types';
import { useApp } from '../context/AppContext';
import { X, ShieldAlert, CheckCircle2, FileText, Upload } from 'lucide-react';

interface ClaimModalProps {
  item: ItemReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ item, isOpen, onClose }) => {
  const { currentUser, submitClaim } = useApp();

  const [proofDescription, setProofDescription] = useState('');
  const [proofDocumentUrl, setProofDocumentUrl] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !item || !currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPG, PNG, WebP, or PDF file no larger than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setProofDocumentUrl(reader.result);
    };
    reader.readAsDataURL(file);
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
        proofDocumentUrl: proofDocumentUrl || undefined
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

          {/* Optional Proof Document / Receipt */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Supporting Proof Attachment (Optional · Max 5MB)
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer transition-colors text-xs text-slate-600">
              <Upload className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">
                {proofDocumentUrl ? 'Supporting image attached ✓' : 'Upload a receipt or non-sensitive supporting proof'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
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
              Transmit Claim to Security Desk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
