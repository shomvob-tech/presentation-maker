export const PRESENTATION_API_URL =
  process.env.NEXT_PUBLIC_PRESENTATION_API_URL ??
  "http://localhost:8000/api/presentations";

export type ClientDetailsPayload = {
  clientName: string;
  clientEmail: string;
  logo: File | null;
  requirements: string;
  notes: string;
};

export async function submitClientDetails(
  payload: ClientDetailsPayload,
): Promise<unknown> {
  const formData = new FormData();
  formData.append("client_name", payload.clientName.trim());
  formData.append("client_email", payload.clientEmail.trim());
  if (payload.logo) {
    formData.append("logo", payload.logo);
  }
  formData.append("requirements", payload.requirements.trim());
  formData.append("notes", payload.notes.trim());

  const response = await fetch(PRESENTATION_API_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      detail || `Request failed with status ${response.status}`,
    );
  }

  return response.json().catch(() => ({}));
}
