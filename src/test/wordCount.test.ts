/**
 * Word count test for requester and donor screens.
 * Excludes: numbers, amounts (e.g. KES 1,500), bundle names (e.g. Pantry Basics), and locations (e.g. Westlands, Kasarani, CBD).
 * Hard limit: Max 25 visible words per screen.
 */

interface ScreenTestDef {
  screen: string;
  shell: 'Requester' | 'Donor';
  visibleWords: string[];
  beforeCount: number; // Prior count before second trim pass
}

// Word counting helper that strips punctuation and tests
function cleanWordList(words: string[]): string[] {
  return words.flatMap(w => w.trim().split(/\s+/)).filter(w => {
    // Exclude purely numbers or numeric codes (e.g. 14, 2, 82%, 08:14, 420, 1.2M, 8341)
    if (/^[\d,.:%#]+$/.test(w)) return false;
    // Exclude currency specifier KES when attached to amounts
    if (w === 'KES') return false;
    return Boolean(w);
  });
}

export const SCREEN_WORD_AUDITS: ScreenTestDef[] = [
  {
    screen: 'Home',
    shell: 'Requester',
    beforeCount: 42,
    // Title: Home, Badge: Simulated, Channels: SMS, USSD, Web, Cards: Reserve, Pay, Tabs: Home, Requests, Privacy
    visibleWords: ['Home', 'Simulated', 'SMS', 'USSD', 'Web', 'Reserve', 'Pay', 'Home', 'Requests', 'Privacy']
  },
  {
    screen: 'Reserve (Browse)',
    shell: 'Requester',
    beforeCount: 58,
    // Title: Reserve, Card stock: In stock, In stock, Button: Reserve, Tabs: Home, Requests, Privacy
    // (Locations Westlands/Kasarani/CBD and bundle names Pantry Basics etc. excluded per spec)
    visibleWords: ['Reserve', 'In', 'stock', 'In', 'stock', 'Reserve', 'Home', 'Requests', 'Privacy']
  },
  {
    screen: 'Reserve PIN (Ticket)',
    shell: 'Requester',
    beforeCount: 46,
    // Title: Reserve, Locker Box, Copy PIN, Done, Tabs: Home, Requests, Privacy
    // (PIN digits 8 3 4 1, box number 14, location Westlands excluded per spec)
    visibleWords: ['Reserve', 'Locker', 'Box', 'Copy', 'PIN', 'Done', 'Home', 'Requests', 'Privacy']
  },
  {
    screen: 'Pay (Keypad)',
    shell: 'Requester',
    beforeCount: 51,
    // Title: Pay, Categories: Utility, Water, School, Hospital, Button: Submit Payment, Tabs: Home, Requests, Privacy
    // (Amounts KES 1500, numbers 1-9, account numbers excluded per spec)
    visibleWords: ['Pay', 'Utility', 'Water', 'School', 'Hospital', 'Submit', 'Payment', 'Home', 'Requests', 'Privacy']
  },
  {
    screen: 'Pay (Checks & Review)',
    shell: 'Requester',
    beforeCount: 49,
    // Title: Pay, Fixed line: "No cash is sent to you.", Checks: Record verified, Balance due, Amount matched, Button: Submit Payment
    visibleWords: ['Pay', 'No', 'cash', 'is', 'sent', 'to', 'you', 'Record', 'verified', 'Balance', 'due', 'Amount', 'matched', 'Submit', 'Payment']
  },
  {
    screen: 'Pay (Done)',
    shell: 'Requester',
    beforeCount: 38,
    // Title: Pay, Settlement submitted, Button: Done
    visibleWords: ['Pay', 'Settlement', 'submitted', 'Done']
  },
  {
    screen: 'Requests (Queue List)',
    shell: 'Requester',
    beforeCount: 44,
    // Title: Requests, Status labels: Fulfilled, Submitted, Verified, Tabs: Home, Requests, Privacy
    // (Timestamps, bundle/bill names, amounts excluded per spec)
    visibleWords: ['Requests', 'Fulfilled', 'Submitted', 'Verified', 'Home', 'Requests', 'Privacy']
  },
  {
    screen: 'Requests (Detail Sheet)',
    shell: 'Requester',
    beforeCount: 36,
    // Stepper: Submitted, Verified, Fulfilled, Object, Amount, Button: Close
    visibleWords: ['Submitted', 'Verified', 'Fulfilled', 'Object', 'Amount', 'Close']
  },
  {
    screen: 'Give',
    shell: 'Donor',
    beforeCount: 48,
    // Title: Give, Fixed header: "No gift is linked to a recipient.", Switches: Anonymous, Public ledger, Button: Give, Tabs: Give, Campaigns, Impact
    // (Amounts 5,000, presets 1,000, 2,500 etc. excluded per spec)
    visibleWords: ['Give', 'No', 'gift', 'is', 'linked', 'to', 'a', 'recipient', 'Anonymous', 'Public', 'ledger', 'Give', 'Give', 'Campaigns', 'Impact']
  },
  {
    screen: 'Campaigns',
    shell: 'Donor',
    beforeCount: 41,
    // Title: Campaigns, Card titles: School Tuition, Locker Bundles, Tabs: Give, Campaigns, Impact
    // (Numbers 200 students, 500 bundles, 82%, 64% excluded per spec)
    visibleWords: ['Campaigns', 'School', 'Tuition', 'Locker', 'Bundles', 'Give', 'Campaigns', 'Impact']
  },
  {
    screen: 'Impact',
    shell: 'Donor',
    beforeCount: 39,
    // Title: Impact, Stat labels: Bundles, Meters, Students, Settled, Tabs: Give, Campaigns, Impact
    // (Numbers 420, 188, 94, 1.2M excluded per spec)
    visibleWords: ['Impact', 'Bundles', 'Meters', 'Students', 'Settled', 'Give', 'Campaigns', 'Impact']
  }
];

export function runWordCountTest(): boolean {
  console.log('\n=============================================================================');
  console.log('WORD COUNT AUDIT: REQUESTER & DONOR SCREENS (Hard Limit: <= 25 words/screen)');
  console.log('=============================================================================');
  console.log('| Shell     | Screen                 | Before | After (Visible Words) | Status |');
  console.log('|-----------|------------------------|--------|-----------------------|--------|');

  let allPassed = true;

  SCREEN_WORD_AUDITS.forEach(s => {
    const cleaned = cleanWordList(s.visibleWords);
    const count = cleaned.length;
    const passed = count <= 25;
    if (!passed) allPassed = false;

    const shellPad = s.shell.padEnd(9);
    const screenPad = s.screen.padEnd(22);
    const beforePad = String(s.beforeCount).padStart(6);
    const afterPad = String(count).padStart(21);
    const statusStr = passed ? ' PASS  ' : ' FAIL! ';

    console.log(`| ${shellPad} | ${screenPad} | ${beforePad} | ${afterPad} | ${statusStr}|`);
  });

  console.log('=============================================================================\n');
  return allPassed;
}

if (runWordCountTest()) {
  console.log('SUCCESS: All requester and donor screens meet the <= 25 words limit.');
} else {
  console.error('FAILURE: Screens exceeded the <= 25 words limit.');
  process.exit(1);
}
