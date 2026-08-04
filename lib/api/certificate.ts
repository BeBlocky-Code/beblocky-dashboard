export interface ICertificateStats {
  total: number;
  active: number;
  expired: number;
  byType: { [key: string]: number };
}

const getApiUrl = (endpoint: string) => {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }
  return `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
};

export const certificateApi = {
  async getStats(): Promise<ICertificateStats> {
    try {
      const response = await fetch(getApiUrl("/certificates/stats"), {
        credentials: "include",
      });

      if (!response.ok) {
        // Fallback: count from list endpoint if stats fails
        const listResponse = await fetch(getApiUrl("/certificates"), {
          credentials: "include",
        });
        if (!listResponse.ok) {
          return { total: 0, active: 0, expired: 0, byType: {} };
        }
        const list = await listResponse.json();
        const certificates = Array.isArray(list) ? list : [];
        const active = certificates.filter(
          (c: { isActive?: boolean }) => c.isActive !== false
        ).length;
        return {
          total: certificates.length,
          active,
          expired: certificates.length - active,
          byType: {},
        };
      }

      return response.json();
    } catch (error) {
      console.warn("Certificate stats error:", error);
      return { total: 0, active: 0, expired: 0, byType: {} };
    }
  },
};
