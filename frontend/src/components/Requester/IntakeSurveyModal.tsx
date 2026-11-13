import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { submitIntake } from '../../lib/apiClient';
import { useToast } from '../Shared/Toast';

interface Props {
  token: string;
  requestId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const IntakeSurveyModal: React.FC<Props> = ({ token, requestId, onClose, onSuccess }) => {
  const [familySize, setFamilySize] = useState<number>(2);
  const [workStatus, setWorkStatus] = useState<string>('casual');
  const [industry, setIndustry] = useState<string>('informal');
  const [primaryNeed, setPrimaryNeed] = useState<string>('food');
  const [consentAggregate, setConsentAggregate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { push } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await submitIntake(token, {
        request_id: requestId,
        family_size: familySize,
        work_status: workStatus,
        industry,
        primary_need: primaryNeed,
        consent_to_aggregate: consentAggregate,
        consent_to_followup: true,
      });
      push({ kind: 'success', message: 'Questionnaire completed. Basket sized.' });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit survey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F4] w-full max-w-md rounded-3xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-[#E8E6DE]">
          <h2 className="text-lg font-semibold text-[#111111]">Household Details</h2>
          <button onClick={onClose} className="p-2 bg-black/5 rounded-full hover:bg-black/10"><X className="w-4 h-4" /></button>
        </div>
        
        <div className="p-5 overflow-y-auto space-y-6">
          <div>
            <label className="text-sm font-semibold text-[#111111] block mb-3">How many people are in your household?</label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <button key={n} onClick={() => setFamilySize(n)} className={`w-10 h-10 rounded-xl text-sm font-medium ${familySize === n ? 'bg-[#1F6B4A] text-white' : 'bg-white border border-[#E8E6DE] text-[#111111]'}`}>
                  {n === 8 ? '8+' : n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#111111] block mb-2">Work Status</label>
            <select value={workStatus} onChange={e => setWorkStatus(e.target.value)} className="w-full h-12 px-3 rounded-xl border border-[#E8E6DE] bg-white text-sm">
              <option value="employed">Employed</option>
              <option value="self_employed">Self Employed</option>
              <option value="casual">Casual Laborer</option>
              <option value="unemployed">Unemployed</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#111111] block mb-2">Industry</label>
            <select value={industry} onChange={e => setIndustry(e.target.value)} className="w-full h-12 px-3 rounded-xl border border-[#E8E6DE] bg-white text-sm">
              <option value="informal">Informal / Jua Kali</option>
              <option value="formal">Formal / Office</option>
              <option value="agriculture">Agriculture</option>
              <option value="services">Services / Retail</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="none">None</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#111111] block mb-2">Primary Need</label>
            <select value={primaryNeed} onChange={e => setPrimaryNeed(e.target.value)} className="w-full h-12 px-3 rounded-xl border border-[#E8E6DE] bg-white text-sm">
              <option value="food">Food Bundle</option>
              <option value="utilities">Utility Bill (KPLC)</option>
              <option value="school_fees">School Fees</option>
              <option value="hospital">Hospital Invoice</option>
              <option value="rent">Rent</option>
            </select>
          </div>

          <label className="flex items-start gap-3 p-3 bg-white border border-[#E8E6DE] rounded-xl cursor-pointer">
            <input type="checkbox" checked={consentAggregate} onChange={e => setConsentAggregate(e.target.checked)} className="mt-1" />
            <div className="text-xs text-[#4A4F4B] leading-relaxed">
              I consent to my anonymous household data being included in aggregate statistics for donors and partners.
            </div>
          </label>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
        </div>

        <div className="p-5 border-t border-[#E8E6DE]">
          <button onClick={handleSubmit} disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </div>
    </div>
  );
};
