import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../ui/Button';
import { StatusStepper } from '../../ui/Stepper';
import { EmptyState } from '../../ui/EmptyState';
import { Sheet } from '../../ui/Sheet';
import { 
  Inbox, 
  Package, 
  ReceiptText, 
  Clock, 
  ShieldCheck, 
  CheckCircle2,
  ChevronRight,
  Info 
} from 'lucide-react';
import { ResourceRequest } from '../../types';

export const RequestsTab: React.FC = () => {
  const { requests, setRequesterScreen, t } = useApp();
  const [selectedReq, setSelectedReq] = useState<ResourceRequest | null>(null);
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  const [infoSheetOpen, setInfoSheetOpen] = useState<boolean>(false);

  const handleOpenDetails = (req: ResourceRequest) => {
    setSelectedReq(req);
    setSheetOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return <CheckCircle2 className="w-4 h-4 text-[#1F6B4A]" strokeWidth={1.75} />;
      case 'verified':
        return <ShieldCheck className="w-4 h-4 text-[#1F6B4A]" strokeWidth={1.75} />;
      default:
        return <Clock className="w-4 h-4 text-[#111111]/60" strokeWidth={1.75} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return t('stepper_fulfilled');
      case 'verified':
        return t('stepper_verified');
      default:
        return t('stepper_submitted');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-20 animate-in fade-in">
      
      {/* Top Header: 56px */}
      <div className="h-14 flex items-center justify-between border-b border-[#111111]/10">
        <h1 className="font-serif text-[28px] font-bold text-[#111111]">
          {t('requests_title')}
        </h1>
        <button
          onClick={() => setInfoSheetOpen(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-black/5 text-[#111111]/70 cursor-pointer"
          aria-label="Requests info"
        >
          <Info className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Empty State */}
      {requests.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-6 h-6 text-[#1F6B4A]" strokeWidth={1.75} />}
          message={t('empty_requests_sub')}
          buttonLabel={t('btn_create_request')}
          onAction={() => setRequesterScreen('swap')}
        />
      ) : (
        /* Chat-Style Rows: 48px round icon, title, one status line, time at right, thin divider */
        <div className="bg-white rounded-[18px] border border-[#111111]/10 overflow-hidden divide-y divide-[#111111]/10">
          {requests.map(req => {
            const isSwap = req.category === 'swap' || req.type === 'swap';
            const icon = isSwap ? (
              <Package className="w-6 h-6 text-[#1F6B4A]" strokeWidth={1.75} />
            ) : (
              <ReceiptText className="w-6 h-6 text-[#1F6B4A]" strokeWidth={1.75} />
            );

            return (
              <div
                key={req.id}
                onClick={() => handleOpenDetails(req)}
                className="p-4 flex items-center gap-3.5 hover:bg-[#FAF8F4]/80 active:bg-black/5 transition-colors cursor-pointer min-h-[72px]"
              >
                {/* 48px round sage icon container with green icon */}
                <div className="w-12 h-12 rounded-full bg-[#DCE8E0] flex items-center justify-center shrink-0">
                  {icon}
                </div>

                {/* Title & One Status Line */}
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-[#111111] truncate">
                    {req.categoryTitle}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-[#111111]/70 mt-0.5">
                    {getStatusIcon(req.status)}
                    <span className="font-medium text-[#111111]">
                      {getStatusLabel(req.status)}
                    </span>
                  </div>
                </div>

                {/* Time at right + chevron */}
                <div className="flex items-center gap-1.5 text-right shrink-0">
                  <span className="text-sm font-mono text-[#111111]/60">
                    {req.timestamp.includes('Today') ? req.timestamp.replace('Today, ', '') : req.timestamp.split(',')[0]}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#111111]/30" strokeWidth={1.75} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Bottom Sheet with 3-Dot Stepper */}
      <Sheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={selectedReq?.categoryTitle || t('requests_title')}
      >
        {selectedReq && (
          <div className="space-y-4">
            {/* 3-Dot Stepper */}
            <div className="py-2">
              <StatusStepper status={selectedReq.status} />
            </div>

            {/* Object Reference & Amount */}
            <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#111111]/10 space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-[#111111]/60">Object</span>
                <span className="font-bold text-[#111111]">{selectedReq.objectIdMasked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#111111]/60">Amount</span>
                <span className="font-bold text-[#1F6B4A]">KES {selectedReq.amount.toLocaleString()}</span>
              </div>
              {selectedReq.pinCode && (
                <div className="flex justify-between border-t border-[#111111]/10 pt-2">
                  <span className="text-[#111111]/60">Locker PIN</span>
                  <span className="font-bold text-[#1F6B4A] text-lg tracking-widest">{selectedReq.pinCode}</span>
                </div>
              )}
            </div>

            <Button fullWidth variant="outline" size="md" onClick={() => setSheetOpen(false)}>
              {t('btn_close')}
            </Button>
          </div>
        )}
      </Sheet>

      {/* Info Sheet */}
      <Sheet
        isOpen={infoSheetOpen}
        onClose={() => setInfoSheetOpen(false)}
        title={t('requests_title')}
      >
        <div className="space-y-3">
          <p>Real-time queue tracking for locker bundles and utility payments.</p>
          <Button fullWidth variant="outline" size="md" onClick={() => setInfoSheetOpen(false)}>
            {t('btn_close')}
          </Button>
        </div>
      </Sheet>

    </div>
  );
};
