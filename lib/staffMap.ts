export const staffImageMap: Record<string, string> = {
  "67": "N_Adamya",
  "23": "B_Adamya",
  "73": "N_Aaditya",
  "49": "N_Aananta",
  "26": "B_Aananta",
  "55": "N_Aaryan",
  "42": "N_Amani",
  "72": "N_Anupam",
  "28": "B_Anupam",
  "19": "B_Bibek",
  "81": "N_Bibek",
  "57": "N_Dipesh",
  "30": "B_Dipesh",
  "75": "N_Ganesh",
  "27": "B_Ganesh",
  "16": "B_Khusbu",
  "5": "N_Kushal",
  "66": "N_Neelayam",
  "f795445c-4fd6-41cf-b35e-bbaebdad878a": "N_Prakash",
  "88": "N_Prapti",
  "5a46d0d2-e165-4b36-bf33-5594fb2863d8": "N_Rishav",
  "c02a12d3-cdac-4d0a-808d-ddd7ca2ee23a": "N_Rohan",
  "76": "N_Rohit",
  "24": "B_Rohit",
  "43": "N_Sadikshya",
  "70": "N_Safalta",
  "83": "N_Salin",
  "50": "N_Sanisha",
  "31": "B_Sashipa",
  "a30cfc37-cb3e-4a33-b6b7-35b3ebd8b837": "N_Sneha",
  "48": "N_Somita",
  "25": "B_Somita",
  "84": "N_Sourab",
  "13": "N_Subas",
  "22": "B_Subas",
  "89": "N_SubashT",
  "17": "B_Unesh",
  "80": "N_Unesh",
  "21": "B_Tika",
  "79": "N_Tika",
  "85": "N_Nischal",
  "1": "Anjel",
  "4": "Anjel",
  "90":"N_Sneha",
  "86":"N_Prakash"
};

/**
 * Returns the image path for a given admin_id, or null if not mapped.
 */
export function getStaffImage(adminId: string): string | null {
  const stem = staffImageMap[adminId];
  return stem ? `/staff/${stem}.png` : null;
}
