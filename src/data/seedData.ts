import { ItemCategory } from '../types';

// Reference data only. No sample users, reports, claims, or audit records are
// loaded into the live system; all operational data comes from Supabase.
export const UCC_LOCATIONS = [
  'Sam Jonah Library (Main)',
  'Sam Jonah Library - Knowledge Commons',
  'Casely Hayford Hall (CASFORD)',
  'Valco Hall (Industrialists)',
  'Oguaa Hall (Ape Ape Monkeys)',
  'Adehye Hall (Royals)',
  'Atlantic Hall (MARINERS)',
  'Kwame Nkrumah Hall',
  'Superannuation Hall',
  'New Science Block / SLT',
  'Sandwich Lecture Theatre (SWLT)',
  'FELT Lecture Complex',
  'C.A.G.E Complex (Computer Labs)',
  'UCC Hospital & Clinic',
  'Central Administration Block',
  'North Gate / Central Security Post',
  'South Gate Security Post',
  'SRC Hostel & Complex',
  'UCC Sports Stadium & Gym',
  'Faculty of Arts Lecture Theatre',
  'School of Business Complex'
];

export const UCC_HALLS = [
  'Casely Hayford Hall',
  'Valco Hall',
  'Oguaa Hall',
  'Adehye Hall',
  'Atlantic Hall (ATL)',
  'Kwame Nkrumah Hall',
  'Superannuation Hall',
  'SRC Hostel',
  'Valco Trust Hostel',
  'Off-Campus (Amamoma)',
  'Off-Campus (Kwaprow)',
  'Off-Campus (Apewosika)',
  'Off-Campus (Science / Ayensu)'
];

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Student ID & Cards',
  'Electronics & Phones',
  'Calculators & Academic',
  'Keys & Lanyards',
  'Wallets & Bags',
  'Books & Documents',
  'Clothing & Accessories',
  'Other'
];
