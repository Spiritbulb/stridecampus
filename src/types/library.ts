export interface LibraryResource {
  id: string;
  title: string;
  description: string;
  file_key: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  downloads: number;
  categories: string[];
  is_public: boolean;
}

export interface UploadResourceData {
  title: string;
  description: string;
  file: File;
  categories: string[];
  is_public: boolean;
}