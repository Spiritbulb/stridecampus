export interface LibraryFile {
  id: string;
  user_id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  file_category: string;
  description: string;
  tags: string[];
  subject: string;
  storage_path: string;
  created_at: string;
  resource_type: string;
  youtube_url?: string;
  url?: string;
  metadata?: any;
  users: {
    full_name: string;
    school_name: string;
    username: string;
    checkmark: boolean;
  };
}

export interface User {
  id: string;
  // Add other user properties as needed
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const SUBJECT_OPTIONS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Engineering',
  'Literature',
  'History',
  'Geography',
  'Economics',
  'Business',
  'Psychology',
  'Philosophy',
  'Art & Design',
  'Music',
  'Health Sciences',
  'Law',
  'Education',
  'Other'
];

export const RESOURCE_TYPE_OPTIONS = [
  { value: 'file', label: 'PDF File' },
  { value: 'youtube', label: 'YouTube Video' }
];