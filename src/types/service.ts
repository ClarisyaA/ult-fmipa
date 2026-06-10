export type PublicService = {
  title: string;
  slug: string;
  category: string;
  description: string;
  requirements: string[];
  processingTime: string;
  sourceTable: string;
  totalRequests?: number;
};
