export type ListingClaimRequestFormValues = {
  businessName: string;
  businessStartDate: string;
  businessRegistrationDate: string;
  businessDocumentUrl: string;
  additionalNotes: string;
  attachmentUrls: string;
};

function isValidUrl(value: string) {
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}

function parseAttachmentUrls(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateListingClaimRequestForm(values: ListingClaimRequestFormValues): string[] {
  const errors: string[] = [];
  const businessName = values.businessName.trim();
  const businessDocumentUrl = values.businessDocumentUrl.trim();
  const businessStartDate = values.businessStartDate.trim();
  const businessRegistrationDate = values.businessRegistrationDate.trim();

  if (businessName.length < 2) {
    errors.push("Business name must be at least 2 characters.");
  }

  if (!businessStartDate) {
    errors.push("Business start date is required.");
  }

  if (!businessRegistrationDate) {
    errors.push("Business registration date is required.");
  }

  if (!businessDocumentUrl) {
    errors.push("Business document link is required.");
  } else if (!isValidUrl(businessDocumentUrl)) {
    errors.push("Business document must be a valid URL.");
  }

  const attachments = parseAttachmentUrls(values.attachmentUrls);
  const invalidAttachments = attachments.filter((url) => !isValidUrl(url));
  if (invalidAttachments.length) {
    errors.push("Each attachment must be a valid URL.");
  }

  return errors;
}

export function parseListingClaimRequestAttachments(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}
