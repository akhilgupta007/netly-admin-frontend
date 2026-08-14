/**
 * The submission row shape KYCDocumentReviewModal renders.
 *
 * Shared because two screens open that modal — the KYC queue, and a provider's
 * action menu on Accounts. Keeping one mapper means a field fixed in one place
 * is fixed in both; the alternative is two copies that drift, which is how
 * documentLabels ended up missing from one of them before.
 *
 * @param {object} item - A row from fetchKycSubmissionsFromFirestore.
 * @return {object} The row the review modal expects.
 */
export function toKycSubmissionRow(item) {
  return {
    id: item.id,
    // The callable needs the real uid; item.id is a display code (PR-xxxxxx).
    uid: item.uid,
    name: item.providerName || "Provider",
    // Readable labels, not raw slugs. The column rendered "governmentId" and
    // the filter compared that slug against labels like "Proof of Address", so
    // nothing ever matched. A submission can carry more than one document, so
    // show them all — this previously showed only the first, which read as
    // though the other had not been submitted.
    docType: (item.documentLabels || []).join(", ") || "Not specified",
    documentLabels: item.documentLabels || [],
    docFile:
      item.verificationDocuments?.[0]?.name ||
      `${item.documents?.[0] || "ID"}_Document.pdf`,
    submittedDate: item.submittedAt,
    status:
      item.status === "Approved" ?
        "Approved" :
        item.status === "Rejected" ?
          "Rejected" :
          "In Review",
    email: item.email || "",
    phone: item.phoneNumber || "—",
    // Account creation date, not the KYC submission date.
    joined: item.joinedAt,
    reviewedAt: item.reviewedAt,
    verificationDocuments: item.verificationDocuments,
    // Raw slug (notSubmitted/pending/verified/rejected) — sent as
    // expectedStatus so a concurrent decision is detected server-side.
    kycStatus: item.kycStatus,
    rejectionReason: item.rejectionReason,
  };
}
