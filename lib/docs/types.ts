export type DocManifestEntry = {
  slug: string;
  title: string;
  description?: string;
  file: string;
};

export type DocManifest = {
  user: DocManifestEntry[];
  admin: DocManifestEntry[];
};

export type DocManifestSummary = {
  slug: string;
  title: string;
  description?: string;
};
