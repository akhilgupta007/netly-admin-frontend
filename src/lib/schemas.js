import { z } from "zod";

/**
 * 1. User Document Zod Schema (users/{uid})
 */
export const userSchema = z.object({
  id: z.string(),
  uid: z.string(),
  email: z.string().email().catch(""),
  accountType: z.enum(["client", "provider"]).nullable().catch(null),
  otpVerified: z.boolean().catch(false),
  createdAt: z.any().optional(),
  fullName: z.string().nullable().catch(null),
  firstName: z.string().nullable().catch(null),
  lastName: z.string().nullable().catch(null),
  phoneNumber: z.string().catch(""),
  countryCode: z.string().catch(""),
  photoUrl: z.string().catch(""),
  // Display form ("Active"/"Invited"/"Banned"). This was a lowercase enum while
  // the service passed a capitalised value, so every parse fell through to the
  // catch and every user read as active regardless of their real status.
  status: z.string().catch("Active"),
});

/**
 * 2. Client Profile Zod Schema (users/{uid}/client/{clientId})
 */
export const clientProfileSchema = z.object({
  id: z.string(),
  uid: z.string(),
  name: z.string(),
  email: z.string().catch(""),
  phoneNumber: z.string().catch(""),
  photoUrl: z.string().catch(""),
  joinDate: z.string().catch("N/A"),
  // Raw timestamp retained alongside the formatted string so date filtering
  // sorts on the real value rather than a parsed display string.
  createdAtRaw: z.any().nullable().optional(),
  otp: z.string().catch("Verified"),
  bookings: z.number().catch(0),
  wallet: z.number().catch(0.0),
  creditUsed: z.number().catch(0.0),
  profileCompleted: z.boolean().catch(false),
  addressCompleted: z.boolean().catch(false),
  onboardingCompleted: z.boolean().catch(false),
  status: z.string().catch("Active"),
});

/**
 * 3. Provider Profile Zod Schema (users/{uid}/provider/{providerId})
 */
export const providerProfileSchema = z.object({
  id: z.string(),
  uid: z.string(),
  name: z.string(),
  firstName: z.string().catch(""),
  lastName: z.string().catch(""),
  email: z.string().catch(""),
  phoneNumber: z.string().catch(""),
  city: z.string().catch("Boston"),
  province: z.string().catch(""),
  country: z.string().catch("Canada"),
  street: z.string().catch(""),
  apt: z.string().nullable().catch(null),
  postalCode: z.string().catch(""),
  about: z.string().catch(""),
  yearsOfExperience: z.string().catch(""),
  serviceRadiusKm: z.number().nullable().catch(null),
  // Ratings live in the top-level `reviews` collection (Schema v3.0 §9); there
  // is no rating field on a provider, so this is null until that is wired.
  rating: z.string().nullable().catch(null),
  joinDate: z.string().catch("N/A"),
  createdAtRaw: z.any().nullable().optional(),
  kyc: z.string().catch("Not Submitted"),
  kycStatus: z
    .enum(["notSubmitted", "pending", "verified", "rejected"])
    .catch("notSubmitted"),
  isKycVerified: z.boolean().catch(false),
  kycSubmittedAt: z.string().catch("N/A"),
  kycReviewedAt: z.string().catch("N/A"),
  kycRejectionReason: z.string().catch(""),
  verificationDocuments: z.array(z.any()).catch([]),
  selectedDocuments: z.array(z.string()).catch([]),
  skills: z.array(z.string()).catch([]),
  badges: z.array(z.string()).catch([]),
  isFoundingPartner: z.boolean().catch(false),
  walletBalance: z.number().catch(0.0),
  creditUsed: z.number().catch(0.0),
  stripeAccountId: z.string().catch(""),
  stripeAccountType: z.string().catch(""),
  chargesEnabled: z.boolean().catch(false),
  payoutsEnabled: z.boolean().catch(false),
  isActive: z.boolean().catch(true),
  status: z.string().catch("Active"),
});

/**
 * 4. KYC Submission Zod Schema
 */
export const kycSubmissionSchema = z.object({
  id: z.string(),
  // Document id in the top-level `kyc` collection; null for legacy records
  // where KYC state lives only on the provider document.
  kycId: z.string().nullable().optional(),
  uid: z.string(),
  providerName: z.string(),
  email: z.string().catch(""),
  phoneNumber: z.string().catch(""),
  city: z.string().catch(""),
  submittedAt: z.string().catch("N/A"),
  submittedAtRaw: z.any().nullable().optional(),
  date: z.string().catch("N/A"),
  documents: z.array(z.string()).catch([]),
  documentLabels: z.array(z.string()).catch([]),
  verificationDocuments: z.array(z.any()).catch([]),
  joinedAtRaw: z.any().nullable().optional(),
  reviewedAt: z.string().catch("N/A"),
  status: z.string().catch("Pending"),
  kycStatus: z.string().catch("pending"),
  isKycVerified: z.boolean().catch(false),
  rejectionReason: z.string().catch(""),
});
