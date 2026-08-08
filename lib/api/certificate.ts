import { apiFetch } from "@/lib/api/utils";

export interface ICertificateStats {
  total: number;
  active: number;
  expired: number;
  byType: { [key: string]: number };
}

export const certificateApi = {
  async getStats(): Promise<ICertificateStats> {
    try {
      return await apiFetch<ICertificateStats>("/certificates/stats");
    } catch {
      // Fallback: derive from list when stats endpoint is unavailable
      const list = await apiFetch<Array<{ isActive?: boolean }>>("/certificates");
      const certificates = Array.isArray(list) ? list : [];
      const active = certificates.filter((c) => c.isActive !== false).length;
      return {
        total: certificates.length,
        active,
        expired: certificates.length - active,
        byType: {},
      };
    }
  },
};
