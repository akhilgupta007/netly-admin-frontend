import { 
  db, 
  collection, 
  getDocs, 
  query, 
  where,
  collectionGroup
} from "@/lib/firebase";
import { 
  userSchema, 
  clientProfileSchema, 
  providerProfileSchema, 
  kycSubmissionSchema 
} from "@/lib/schemas";

/**
 * Format Timestamp or Date object safely into a readable string
 */
export function formatFirestoreDate(timestamp) {
  if (!timestamp) return "N/A";
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }
  if (typeof timestamp === "string" || typeof timestamp === "number") {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }
  return "N/A";
}

/**
 * 1. Read all User documents from `users` collection & validate with Zod
 */
export async function fetchUsersFromFirestore() {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    if (snapshot.empty) return [];

    const rawUsers = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        uid: docSnap.id,
        email: data.email || "",
        accountType: data.accountType || null,
        otpVerified: Boolean(data.otpVerified),
        createdAt: data.createdAt,
        fullName: data.fullName || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null),
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phoneNumber: data.phoneNumber || "",
        countryCode: data.countryCode || "",
        photoUrl: data.photoUrl || "",
        status: data.status ? (data.status.charAt(0).toUpperCase() + data.status.slice(1)) : "Active"
      };
    });

    return rawUsers.map((item) => userSchema.parse(item));
  } catch (error) {
    console.warn("Firestore fetchUsers warning:", error);
    return [];
  }
}

/**
 * 2. Read Client Profiles with Backend Search, Filtering & Pagination
 */
export async function fetchClientsFromFirestore(params = {}) {
  const { 
    searchTerm = "", 
    filterStatus = "All", 
    startDate = null, 
    endDate = null, 
    page = 1, 
    limit = 8 
  } = params;

  try {
    const usersRef = collection(db, "users");
    
    // Query only clients!
    const queryConstraints = [where("accountType", "==", "client")];
    if (filterStatus !== "All") {
      queryConstraints.push(where("status", "==", filterStatus.toLowerCase()));
    }

    const q = query(usersRef, ...queryConstraints);
    const snapshot = await getDocs(q);

    const clientDocs = snapshot.docs;
    if (clientDocs.length === 0) {
      return { items: [], total: 0, totalPages: 1 };
    }

    const clientPromises = clientDocs.map(async (userDoc) => {
      const userData = userDoc.data();
      const clientSubRef = collection(db, `users/${userDoc.id}/client`);
      const clientSubSnap = await getDocs(clientSubRef);
      const clientProfile = clientSubSnap.docs.length > 0 ? clientSubSnap.docs[0].data() : {};

      const rawClient = {
        id: `CL-${userDoc.id.slice(0, 6)}`,
        uid: userDoc.id,
        name: userData.fullName || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.email?.split("@")[0] || "Client"),
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        photoUrl: userData.photoUrl || "",
        joinDate: formatFirestoreDate(userData.createdAt || clientProfile.createdAt),
        otp: userData.otpVerified ? "Verified" : "Pending",
        bookings: 0,
        wallet: clientProfile.walletBalance || 0.00,
        creditUsed: clientProfile.creditUsed || 0.00,
        profileCompleted: Boolean(clientProfile.profileCompleted),
        addressCompleted: Boolean(clientProfile.addressCompleted),
        onboardingCompleted: Boolean(clientProfile.onboardingCompleted),
        status: userData.status ? (userData.status.charAt(0).toUpperCase() + userData.status.slice(1)) : "Active"
      };

      return clientProfileSchema.parse(rawClient);
    });

    let items = (await Promise.all(clientPromises)).filter(Boolean);

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (c) => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
      );
    }

    // Apply date range filter
    if (startDate || endDate) {
      items = items.filter((c) => {
        const itemDate = new Date(c.joinDate);
        if (isNaN(itemDate.getTime())) return true;
        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate && itemDate > new Date(endDate)) return false;
        return true;
      });
    }

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    return { items: paginatedItems, total, totalPages };
  } catch (error) {
    console.error("Firestore fetchClients raw error:", error);
    return { items: [], total: 0, totalPages: 1 };
  }
}

/**
 * 3. Read Provider Profiles with Backend Search, Filtering & Pagination
 */
export async function fetchProvidersFromFirestore(params = {}) {
  const { 
    searchTerm = "", 
    filterStatus = "All", 
    filterKYC = "All", 
    startDate = null, 
    endDate = null, 
    page = 1, 
    limit = 8 
  } = params;

  try {
    const usersRef = collection(db, "users");
    
    // Query only providers!
    const queryConstraints = [where("accountType", "==", "provider")];
    if (filterStatus !== "All") {
      queryConstraints.push(where("status", "==", filterStatus.toLowerCase()));
    }

    const q = query(usersRef, ...queryConstraints);
    const snapshot = await getDocs(q);

    const providerDocs = snapshot.docs;
    if (providerDocs.length === 0) {
      return { items: [], total: 0, totalPages: 1 };
    }

    const providerPromises = providerDocs.map(async (userDoc) => {
      const userData = userDoc.data();
      const providerSubRef = collection(db, `users/${userDoc.id}/provider`);
      const providerSubSnap = await getDocs(providerSubRef);
      const providerProfile = providerSubSnap.docs.length > 0 ? providerSubSnap.docs[0].data() : {};

      const kycRawStatus = providerProfile.kycStatus || "notSubmitted";
      const isKycVerified = kycRawStatus === "verified";
      const kycDisplayStatus = isKycVerified ? "Verified" : kycRawStatus === "pending" ? "Pending" : kycRawStatus === "rejected" ? "Rejected" : "Not Submitted";

      const rawProvider = {
        id: `PR-${userDoc.id.slice(0, 6)}`,
        uid: userDoc.id,
        name: userData.fullName || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.email?.split("@")[0] || "Provider"),
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        city: providerProfile.city || "Boston",
        province: providerProfile.province || "",
        country: providerProfile.country || "Canada",
        street: providerProfile.street || "",
        apt: providerProfile.apt || null,
        postalCode: providerProfile.postalCode || "",
        about: providerProfile.about || "",
        yearsOfExperience: providerProfile.yearsOfExperience || "2+",
        rating: "4.9",
        joinDate: formatFirestoreDate(userData.createdAt || providerProfile.createdAt),
        kyc: kycDisplayStatus,
        kycStatus: kycRawStatus,
        isKycVerified,
        kycSubmittedAt: formatFirestoreDate(providerProfile.kycSubmittedAt),
        kycReviewedAt: formatFirestoreDate(providerProfile.kycReviewedAt),
        kycRejectionReason: providerProfile.kycRejectionReason || "",
        verificationDocuments: providerProfile.verificationDocuments || [],
        selectedDocuments: providerProfile.selectedDocuments || [],
        skills: providerProfile.skills || ["Home Care"],
        badges: ["Provider Pro"],
        walletBalance: providerProfile.walletBalance || 0.00,
        stripeAccountid: providerProfile.stripeAccountid || "",
        stripeAccountType: providerProfile.stripeAccountType || "",
        chargesEnabled: Boolean(providerProfile.chargesEnabled),
        payoutsEnabled: Boolean(providerProfile.payoutsEnabled),
        isActive: providerProfile.isActive !== undefined ? Boolean(providerProfile.isActive) : true,
        status: userData.status ? (userData.status.charAt(0).toUpperCase() + userData.status.slice(1)) : "Active"
      };

      return providerProfileSchema.parse(rawProvider);
    });

    let items = (await Promise.all(providerPromises)).filter(Boolean);

    // Filter search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (p) => p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term) || p.city.toLowerCase().includes(term)
      );
    }

    // Filter KYC
    if (filterKYC !== "All") {
      items = items.filter((p) => p.kyc.toLowerCase() === filterKYC.toLowerCase());
    }

    // Filter date range
    if (startDate || endDate) {
      items = items.filter((p) => {
        const itemDate = new Date(p.joinDate);
        if (isNaN(itemDate.getTime())) return true;
        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate && itemDate > new Date(endDate)) return false;
        return true;
      });
    }

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    return { items: paginatedItems, total, totalPages };
  } catch (error) {
    console.error("Firestore fetchProviders raw error:", error);
    return { items: [], total: 0, totalPages: 1 };
  }
}

/**
 * 4. Read KYC Submissions with Backend Search, Filtering & Pagination
 */
export async function fetchKycSubmissionsFromFirestore(params = {}) {
  const { 
    searchTerm = "", 
    filterStatus = "All", 
    filterDocType = "All", 
    startDate = null, 
    endDate = null, 
    page = 1, 
    limit = 8 
  } = params;

  try {
    const providersResult = await fetchProvidersFromFirestore({ limit: 1000 });
    const providers = providersResult.items || [];

    let rawKyc = providers.map((p) => ({
      id: p.id,
      uid: p.uid,
      providerName: p.name,
      email: p.email,
      phoneNumber: p.phoneNumber,
      city: p.city,
      submittedAt: p.kycSubmittedAt !== "N/A" ? p.kycSubmittedAt : p.joinDate,
      date: p.kycSubmittedAt !== "N/A" ? p.kycSubmittedAt : p.joinDate,
      documents: p.selectedDocuments.length > 0 ? p.selectedDocuments : ["governmentId", "proofOfAddress"],
      verificationDocuments: p.verificationDocuments,
      status: p.kycStatus === "verified" ? "Approved" : p.kycStatus === "pending" ? "Pending" : p.kycStatus === "rejected" ? "Rejected" : "Pending",
      kycStatus: p.kycStatus,
      isKycVerified: p.isKycVerified,
      rejectionReason: p.kycRejectionReason
    }));

    let items = rawKyc.map((item) => kycSubmissionSchema.parse(item));

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (k) => k.providerName.toLowerCase().includes(term) || k.email.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== "All") {
      items = items.filter((k) => {
        if (filterStatus === "In Review") {
          return ["in review", "pending"].includes(k.status.toLowerCase());
        }
        return k.status.toLowerCase() === filterStatus.toLowerCase();
      });
    }

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    return { items: paginatedItems, total, totalPages };
  } catch (error) {
    console.warn("Firestore fetchKycSubmissions error:", error);
    return { items: [], total: 0, totalPages: 1 };
  }
}
