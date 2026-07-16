export type StaffSource = "nest" | "sms" | "babal" | string;

// admin_id is only unique within its own source system (Babal, Nest, SMS each
// assign ids independently), so the same id can belong to different people
// depending on source. Keys are namespaced as "<source>:<admin_id>" to avoid
// cross-brand collisions (e.g. babal admin_id "42" vs nest admin_id "42").
export const staffImageMap: Record<string, string> = {
  "nest:67": "N_Adamya",
  "babal:23": "B_Adamya",
  "nest:73": "N_Aaditya",
  "nest:49": "N_Aananta",
  "babal:26": "B_Aananta",
  "nest:55": "N_Aaryan",
  "nest:42": "N_Amani",
  "babal:42": "B_Isha",
  "nest:72": "N_Anupam",
  "babal:28": "B_Anupam",
  "babal:19": "B_Bibek",
  "nest:81": "N_Bibek",
  "nest:57": "N_Dipesh",
  "babal:30": "B_Dipesh",
  "nest:75": "N_Ganesh",
  "babal:27": "B_Ganesh",
  "babal:16": "B_Khusbu",
  "nest:5": "N_Kushal",
  "nest:66": "N_Neelayam",
  "nest:f795445c-4fd6-41cf-b35e-bbaebdad878a": "N_Prakash",
  "nest:88": "N_Prapti",
  "nest:5a46d0d2-e165-4b36-bf33-5594fb2863d8": "N_Rishav",
  "nest:c02a12d3-cdac-4d0a-808d-ddd7ca2ee23a": "N_Rohan",
  "nest:76": "N_Rohit",
  "babal:24": "B_Rohit",
  "nest:43": "N_Sadikshya",
  "nest:70": "N_Safalta",
  "nest:83": "N_Salin",
  "nest:50": "N_Sanisha",
  "babal:31": "B_Sashipa",
  "nest:a30cfc37-cb3e-4a33-b6b7-35b3ebd8b837": "N_Sneha",
  "nest:48": "N_Somita",
  "babal:25": "B_Somita",
  "nest:84": "N_Sourab",
  "nest:13": "N_Subas",
  "babal:22": "B_Subas",
  "nest:89": "N_SubashT",
  "babal:17": "B_Unesh",
  "nest:80": "N_Unesh",
  "babal:21": "B_Tika",
  "nest:79": "N_Tika",
  "nest:85": "N_Nischal",
  "nest:90": "N_Sneha",
  "nest:86": "N_Prakash",
  "nest:91": "N_Neha",
  "nest:39": "N_Yasoda",
  "nest:d9374296-7647-4312-bc23-b1f6b3254060": "N_Saurya",
  "babal:38": "B_Rispa",

  // Generic system/admin accounts shared across brands (not tied to one person)
  "nest:1": "Anjel",
  "babal:1": "Anjel",
  "sms:1": "Anjel",
  "nest:4": "Anjel",
  "babal:4": "Anjel",
  "sms:4": "Anjel",
};

/**
 * Returns the image path for a given admin_id scoped to its source
 * (nest/sms/babal), or null if not mapped. admin_id alone is not unique
 * across sources, so source must always be supplied.
 */
export function getStaffImage(
  adminId: string,
  source: StaffSource,
): string | null {
  const stem = staffImageMap[`${source}:${adminId}`];
  return stem ? `/staff/${stem}.png` : null;
}
