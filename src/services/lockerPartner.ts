// src/services/lockerPartner.ts
export interface LockerReservation {
  reservationId: string;
  lockerBankId: string;
  pin: string;
  qrPayload: string;
}

export async function reserveLocker(bundleId: string, lockerLocation: string): Promise<LockerReservation> {
  // MOCK — replace with CHUI / ParcelPoint API call
  return {
    reservationId: `res_${Date.now()}`,
    lockerBankId: lockerLocation,
    pin: String(Math.floor(1000 + Math.random() * 9000)),
    qrPayload: `MTC-LK-${lockerLocation.slice(0,3).toUpperCase()}-${Date.now()}`,
  };
}
