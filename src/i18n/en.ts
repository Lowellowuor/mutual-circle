export const en = {
  // Navigation & Shell Titles
  app_name: 'The Mutual Circle',
  simulated_badge: 'Simulated',
  sample_data: 'Sample data',
  
  // Requester Tabs
  tab_home: 'Home',
  tab_requests: 'Requests',
  tab_privacy: 'Privacy',
  
  // Screen Titles (Max 3 words, strictly defined)
  home_title: 'Home',
  swap_title: 'Reserve',
  pool_title: 'Pay',
  requests_title: 'Requests',
  privacy_title: 'Privacy',
  give_title: 'Give',
  campaigns_title: 'Campaigns',
  impact_title: 'Impact',
  partner_title: 'Partner Till',
  
  // Quick channels (SMS removed!)
  channel_ussd: 'USSD',
  channel_sms: 'SMS',
  channel_web: 'Web',
  
  // First Launch Story Cards
  intro_card1_title: 'Private Design',
  intro_card1_body: 'No personal details are asked.',
  intro_card2_title: 'Keyed Token',
  intro_card2_body: 'A private token ensures fairness.',
  intro_card3_title: 'M-Pesa SIM',
  intro_card3_body: 'Our circle stores tokens only.',
  btn_next: 'Next',
  btn_start: 'Start',
  btn_skip: 'Skip',
  
  // Reserve (Swap)
  loc_westlands: 'Westlands',
  loc_kasarani: 'Kasarani',
  loc_cbd: 'CBD',
  in_stock: 'In stock',
  btn_reserve: 'Reserve',
  btn_confirm: 'Confirm',
  btn_copy_pin: 'Copy PIN',
  btn_done: 'Done',
  locker_box: 'Locker Box',
  
  // Pay (Pool)
  cat_utility: 'Utility',
  cat_water: 'Water',
  cat_school: 'School',
  cat_hospital: 'Hospital',
  pool_nocash: 'No cash is sent to you.',
  check_record: 'Record verified',
  check_balance: 'Balance due',
  check_amount: 'Amount matched',
  btn_submit: 'Submit Payment',
  status_submitted_msg: 'Settlement submitted',
  
  // Stepper Labels (Strictly: Submitted, Verified, Fulfilled)
  stepper_submitted: 'Submitted',
  stepper_verified: 'Verified',
  stepper_fulfilled: 'Fulfilled',
  
  // Requests Tab
  empty_requests_title: 'No requests yet',
  empty_requests_sub: 'Reserved items appear here.',
  btn_create_request: 'Reserve Now',
  
  // Donor Shell
  donor_header_rule: 'No gift linked to recipient.',
  tab_give: 'Give',
  tab_campaigns: 'Campaigns',
  tab_impact: 'Impact',
  btn_give: 'Give',
  toggle_anonymous: 'Anonymous',
  toggle_ledger: 'Public ledger',
  
  // Donor Campaigns
  camp_tuition: 'School Tuition',
  camp_bundles: 'Locker Bundles',
  
  // Donor Impact (Icon + number first)
  impact_bundles: 'Bundles',
  impact_meters: 'Meters',
  impact_students: 'Students',
  impact_settled: 'Settled',
  
  // Partner Till
  tab_scanner: 'Scanner',
  tab_statement: 'Statement',
  btn_scan: 'Scan Code',
  btn_verify: 'Verify PIN',
  
  // Privacy Tab (Full privacy content preserved)
  privacy_banner: 'Pending Data Protection Act review.',
  tier1_title: 'What Is Stored',
  tier1_item1: 'Keyed one-way token',
  tier1_item2: 'Category and amount',
  tier1_item3: 'Timestamp and status',
  tier1_item4: 'Keyed object hash',
  tier2_title: 'Never Stored',
  tier2_item1: 'No personal names',
  tier2_item2: 'No residential addresses',
  tier2_item3: 'No clinical details',
  tier2_item4: 'No raw national ID numbers',
  tier3_title: 'Encrypted Store',
  tier3_body: 'Phone encrypted for automated PIN delivery.',
  btn_export_data: 'Export Records',
  btn_correct_data: 'Request Correction',
  btn_delete_data: 'Delete Token',
  
  // Actions & Controls
  btn_close: 'Close',
  btn_cancel: 'Cancel'
};

export type TranslationKey = keyof typeof en;


