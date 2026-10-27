export const reserveLockerSlot = async (location: string): Promise<{ pin: string; qr: string }> => {
  await new Promise(r => setTimeout(r, 600));
  return {
    pin: String(Math.floor(1000 + Math.random() * 9000)),
    qr: `MTC-LK-${location.slice(0, 3).toUpperCase()}-${Date.now()}`,
  };
};

export const verifyObjectLevel = async (objectId: string, amount: number): Promise<{ isValid: boolean; requiresOcr: boolean }> => {
  await new Promise(r => setTimeout(r, 700));
  const digits = objectId.replace(/\D/g, '').length;
  if (digits < 4) return { isValid: false, requiresOcr: false };
  return { isValid: true, requiresOcr: amount > 5000 };
};

export const dispatchToPaymentPartner = async (): Promise<{ receipt: string }> => {
  await new Promise(r => setTimeout(r, 900));
  return { receipt: 'MPESA-' + Math.random().toString(36).substring(2, 10).toUpperCase() };
};