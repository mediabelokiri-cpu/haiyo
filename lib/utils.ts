/**
 * Utility helper to join class names cleanly without external bloat.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format Rupiah currency cleanly (e.g., 29000 -> "Rp29.000")
 */
export function formatRupiah(amount: number): string {
  return "Rp" + amount.toLocaleString("id-ID");
}

/**
 * Calculate user age from date_of_birth (YYYY-MM-DD) per PRD Section 10.
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}
