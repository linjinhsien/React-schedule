import { doc, runTransaction, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function toggleScheduleSlot({
  monthId,
  dateISO,
  uid,
}: {
  monthId: string;
  dateISO: string;
  uid: string;
}) {
  const dayRef = doc(db, 'months', monthId, 'days', dateISO);
  const statsRef = doc(db, 'months', monthId, 'employeeStats', uid);
  const monthRef = doc(db, 'months', monthId);

  return runTransaction(db, async (tx) => {
    const daySnap = await tx.get(dayRef);
    const statsSnap = await tx.get(statsRef);

    // Initialize day data
    const dayData = daySnap.exists() ? daySnap.data() : { date: dateISO, slot1: null, slot2: null };
    let { slot1, slot2 } = dayData;

    // Initialize stats data
    const statsData = statsSnap.exists() ? statsSnap.data() : { daysCount: 0 };
    let daysCount = statsData.daysCount;

    const isAlreadyInSlot1 = slot1 === uid;
    const isAlreadyInSlot2 = slot2 === uid;

    // Action: Remove schedule
    if (isAlreadyInSlot1 || isAlreadyInSlot2) {
      if (isAlreadyInSlot1) slot1 = null;
      if (isAlreadyInSlot2) slot2 = null;
      
      tx.set(dayRef, { date: dateISO, slot1, slot2 }, { merge: true });
      tx.set(statsRef, { daysCount: Math.max(0, daysCount - 1) }, { merge: true });
      
      // Ensure month doc exists
      tx.set(monthRef, { monthId, year: parseInt(monthId.split('-')[0]) }, { merge: true });
      
      return { action: 'removed' as const };
    }

    // Action: Add schedule
    const emptySlot = slot1 === null ? 'slot1' : slot2 === null ? 'slot2' : null;

    if (!emptySlot) {
      throw new Error('DAY_FULL');
    }

    if (daysCount >= 15) {
      throw new Error('MAX_DAYS_REACHED');
    }

    if (emptySlot === 'slot1') slot1 = uid;
    else slot2 = uid;

    tx.set(dayRef, { date: dateISO, slot1, slot2 }, { merge: true });
    tx.set(statsRef, { daysCount: daysCount + 1 }, { merge: true });
    tx.set(monthRef, { monthId, year: parseInt(monthId.split('-')[0]) }, { merge: true });

    return { action: 'added' as const };
  });
}

export async function getEmployeeYearlyStats(year: number, uid: string): Promise<number> {
  let total = 0;
  const promises = [];
  for (let i = 1; i <= 12; i++) {
    const monthId = `${year}-${i.toString().padStart(2, '0')}`;
    const statsRef = doc(db, 'months', monthId, 'employeeStats', uid);
    promises.push(getDoc(statsRef));
  }
  
  const snaps = await Promise.all(promises);
  snaps.forEach(snap => {
    if (snap.exists()) {
      total += snap.data().daysCount || 0;
    }
  });
  
  return total;
}
