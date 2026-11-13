import React from 'react';
import { useLanguage } from '../../i18n';
import { APP_URL } from './constants';

const MobileDock: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 md:hidden bg-white border-t border-[#E8E6DE]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="p-3">
        <a href={APP_URL} className="btn btn-primary w-full">
          {t.common.openApp}
        </a>
      </div>
    </div>
  );
};

export default MobileDock;
