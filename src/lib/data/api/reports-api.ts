import { apiFetch } from "$lib/api-client";

/**
 * Downloads the member list PDF for a specific season
 * @param seasonId - The season ID to generate the report for
 * @returns Promise that resolves when download is complete
 */
export async function downloadMemberListPDF(seasonId: number): Promise<void> {
  const response = await apiFetch(
    `/api/v1.0/reports/members/list/pdf?season=${seasonId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/pdf",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to generate member list PDF: ${response.statusText}`,
    );
  }

  // Get the PDF blob
  const blob = await response.blob();

  // Create a download link and trigger it
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lista_soci_stagione_${seasonId}.pdf`;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Downloads the member detail PDF for a specific member and season
 * @param memberId - The member ID
 * @param seasonId - The season ID to generate the report for
 * @returns Promise that resolves when download is complete
 */
export async function downloadMemberDetailPDF(
  memberId: number,
  seasonId: number,
): Promise<void> {
  const response = await apiFetch(
    `/api/v1.0/reports/members/${memberId}/pdf?season=${seasonId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/pdf",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to generate member detail PDF: ${response.statusText}`,
    );
  }

  // Get the PDF blob
  const blob = await response.blob();

  // Create a download link and trigger it
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dettaglio_socio_${memberId}.pdf`;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
