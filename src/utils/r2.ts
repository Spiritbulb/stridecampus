import { supabase } from './supabaseClient';
import { createTransactionWithCreditsUpdate } from '@/hooks/useTransactions';

// Configuration - update with your R2 API worker URL
const R2_API_URL = 'https://stride-media-api.spiritbulb.workers.dev';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for large files

// Supported link types
export const SUPPORTED_LINK_TYPES = {
  YOUTUBE: 'youtube',
  WEBSITE: 'website',
  ARTICLE: 'article',
  DOCUMENT: 'document_link',
  OTHER: 'other_link'
} as const;

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC: 'application/msword',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  PPT: 'application/vnd.ms-powerpoint',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  XLS: 'application/vnd.ms-excel',
  TEXT: 'text/plain'
} as const;

export const RESOURCE_TYPE_OPTIONS = [
  { value: 'file', label: 'File Upload' },
  { value: 'youtube', label: 'YouTube Video' },
  { value: 'website', label: 'Website Link' },
  { value: 'article', label: 'Article Link' },
  { value: 'document_link', label: 'Document Link' },
  { value: 'other_link', label: 'Other Link' }
];

export async function uploadResourceLink(
  url: string,
  userId: string,
  description: string,
  tags: string,
  subject: string,
  resourceType: string
) {
  try {
    // Validate URL format
    const urlRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?\/?[^\s]*$/;
    if (!urlRegex.test(url)) {
      throw new Error('Invalid URL format');
    }

    // Validate the link exists
    const isValidLink = await validateLink(url);
    if (!isValidLink) {
      throw new Error('Link not accessible or invalid');
    }

    // Determine link type if not specified
    let finalResourceType = resourceType;
    if (!finalResourceType || finalResourceType === 'link') {
      finalResourceType = determineLinkType(url);
    }

    // Prepare tags array
    const tagsArray = tags
      ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    // Extract metadata for specific link types
    let metadata: any = { url };
    let originalName = `Link: ${new URL(url).hostname}`;

    if (finalResourceType === 'youtube') {
      const videoId = extractYoutubeVideoId(url);
      if (videoId) {
        metadata.videoId = videoId;
        originalName = `YouTube Video: ${videoId}`;
      }
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('library')
      .insert({
        user_id: userId,
        url: url,
        description: description || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        subject: subject,
        resource_type: finalResourceType,
        // These fields are null for link resources
        filename: null,
        original_name: originalName,
        file_type: getLinkMimeType(finalResourceType),
        file_size: 0,
        file_category: getLinkCategory(finalResourceType),
        storage_path: null,
        metadata: metadata
      })
      .select(`
        *,
        users (
          full_name,
          school_name,
          username,
          checkmark,
          credits
        )
      `)
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message || 'Failed to save link to database');
    }

    // Award 20 credits for link upload
    try {
      const currentCredits = data.users?.credits || 0;
      const newCreditBalance = currentCredits + 20;
      
      await createTransactionWithCreditsUpdate(
        userId,
        {
          amount: 20,
          description: `${finalResourceType} link upload reward`,
          type: 'bonus',
          reference_id: `${finalResourceType}_upload_${data.id}`,
          metadata: {
            resource_id: data.id,
            url: url,
            upload_type: finalResourceType
          }
        },
        newCreditBalance,
      );
    } catch (creditError) {
      console.error('Failed to award credits for link upload:', creditError);
    }

    return data;

  } catch (error: any) {
    console.error('Error uploading link:', error);
    throw error;
  }
}

// Helper function to determine link type from URL
function determineLinkType(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('arxiv.org') || url.includes('researchgate.net') || url.includes('academia.edu')) {
    return 'article';
  }
  if (url.includes('docs.google.com') || url.includes('drive.google.com') || url.includes('.pdf')) {
    return 'document_link';
  }
  return 'website';
}

// Helper function to get MIME type for link resources
function getLinkMimeType(resourceType: string): string {
  const mimeTypes: { [key: string]: string } = {
    youtube: 'video/youtube',
    website: 'text/html',
    article: 'text/html',
    document_link: 'application/link',
    other_link: 'application/link'
  };
  return mimeTypes[resourceType] || 'application/link';
}

// Helper function to get category for link resources
function getLinkCategory(resourceType: string): string {
  const categories: { [key: string]: string } = {
    youtube: 'video',
    website: 'link',
    article: 'article',
    document_link: 'document',
    other_link: 'link'
  };
  return categories[resourceType] || 'link';
}

// Validate link accessibility
async function validateLink(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StrideCampus/1.0)'
      }
    });
    return response.ok;
  } catch (error) {
    console.warn('Link validation failed, proceeding anyway:', error);
    return true; // Allow upload even if validation fails
  }
}

// Helper function to extract YouTube video ID from various URL formats
function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^\/]+)/,
    /youtube\.com\/v\/([^\/]+)/,
    /youtu\.be\/([^\/]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Helper function to generate unique filenames
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  return `${nameWithoutExt}_${timestamp}_${randomString}.${extension}`;
}

// Helper function to get file type category
function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('text')) return 'text';
  return 'other';
}

// Upload file to R2 via API worker with chunking support
export async function uploadFile(
  file: File, 
  userId: string, 
  description: string = '', 
  tags: string = '', 
  subject: string = '',
  onProgress?: (progress: number) => void
) {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!subject) {
      throw new Error('Subject is required');
    }

    // Validate file type
    if (!isSupportedFileType(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}. Supported types: PDF, DOCX, PPTX, XLSX, and text files.`);
    }

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    
    // Prepare form data for R2 API worker
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', uniqueFilename);
    formData.append('metadata', JSON.stringify({
      userId,
      subject,
      description,
      tags,
      originalName: file.name
    }));

    // Upload to R2 via API worker with progress tracking
    const uploadResponse = await fetchWithProgress(
      `${R2_API_URL}/upload`,
      {
        method: 'POST',
        body: formData,
      },
      onProgress
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      throw new Error((errorData as { error?: string }).error || 'Failed to upload file to R2');
    }

    const r2Result = await uploadResponse.json();

    // Save metadata to Supabase
    const { data, error } = await supabase
      .from('library')
      .insert({
        user_id: userId,
        filename: uniqueFilename,
        original_name: file.name,
        file_type: file.type,
        file_size: file.size,
        resource_type: 'file',
        file_category: getFileCategory(file.type),
        description: description,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        subject: subject,
        storage_path: uniqueFilename,
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
        users (
          full_name,
          school_name,
          credits
        )
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // Try to cleanup R2 file if database insert failed
      try {
        await fetch(`${R2_API_URL}/files/${uniqueFilename}`, {
          method: 'DELETE',
        });
      } catch (cleanupError) {
        console.error('Failed to cleanup R2 file:', cleanupError);
      }
      throw new Error('Failed to save file metadata');
    }

    // Award 20 credits for file upload
    try {
      const currentCredits = data.users?.credits || 0;
      const newCreditBalance = currentCredits + 20;
      
      await createTransactionWithCreditsUpdate(
        userId,
        {
          amount: 20,
          description: 'File upload reward',
          type: 'bonus',
          reference_id: `file_upload_${data.id}`,
          metadata: {
            file_id: data.id,
            file_name: file.name,
            upload_type: 'file'
          }
        },
        newCreditBalance
      );
    } catch (creditError) {
      console.error('Failed to award credits for file upload:', creditError);
    }

    return { 
      success: true, 
      file: data,
      message: 'File uploaded successfully' 
    };

  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// Fetch with progress tracking for large files
async function fetchWithProgress(
  url: string,
  options: RequestInit,
  onProgress?: (progress: number) => void
): Promise<Response> {
  if (!onProgress) {
    return fetch(url, options);
  }

  const response = await fetch(url, options);
  
  if (!response.body) {
    return response;
  }

  const reader = response.body.getReader();
  const contentLength = +(response.headers.get('Content-Length') || 0);
  let receivedLength = 0;
  let chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;

    chunks.push(value);
    receivedLength += value.length;
    
    if (contentLength) {
      onProgress((receivedLength / contentLength) * 100);
    }
  }

  // Reconstruct the response
  const allChunks = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.length;
  }

  return new Response(allChunks, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

// Check if file type is supported
function isSupportedFileType(mimeType: string): boolean {
  const supportedTypes = Object.values(SUPPORTED_FILE_TYPES);
  return supportedTypes.some(type => {
    if (type.endsWith('/*')) {
      const baseType = type.replace('/*', '');
      return mimeType.startsWith(baseType);
    }
    return mimeType === type;
  });
}

// The rest of your existing functions (getFiles, deleteFile, getFileUrl, checkFileExists, getFileById, getUserFiles)
// remain unchanged but should be updated to handle the new resource types

// ... (keep all your existing getFiles, deleteFile, getFileUrl, checkFileExists, getFileById, getUserFiles functions)

// Retrieve file from R2 via API worker or list files from Supabase
export async function getFiles(options: {
  filename?: string;
  userId?: string;
  search?: string;
  category?: string;
  subject?: string;
  resourceType: string | undefined;
  page?: number;
  limit?: number;
}) {
  try {
    const {
      filename,
      userId,
      search,
      category,
      subject,
      page = 1,
      limit = 20
    } = options;

    // If filename is provided, fetch the file from R2 via API worker
    if (filename) {
      const response = await fetch(`${R2_API_URL}/files/${filename}`);
      
      if (!response.ok) {
        throw new Error('File not found');
      }

      return response;
    }

    // Build query to list files from Supabase
    let query = supabase
      .from('library')
      .select(`
        *,
        users (
          full_name,
          username,
          school_name,
          username,
          checkmark
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });


    // Apply filters
    if (search) {
      query = query.or(`original_name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    if (category && category !== 'all') {
      query = query.eq('file_category', category);
    }

    if (subject && subject !== 'all') {
      query = query.eq('subject', subject);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to retrieve files');
    }

    return {
      files: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };

  } catch (error) {
    console.error('GET error:', error);
    throw error;
  }
}

// Remove file from R2 via API worker and database
export async function deleteFile(fileId: string, userId: string) {
  try {
    if (!fileId || !userId) {
      throw new Error('File ID and User ID are required');
    }
    
    // First, get the file details to ensure user owns it
    const { data: fileData, error: fetchError } = await supabase
      .from('library')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !fileData) {
      throw new Error('File not found or access denied');
    }

    // Delete from R2 via API worker
    const deleteResponse = await fetch(`${R2_API_URL}/files/${fileData.storage_path}`, {
      method: 'DELETE',
    });

    if (!deleteResponse.ok) {
      throw new Error('Failed to delete file from R2');
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('library')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Failed to delete from database:', deleteError);
      throw new Error('Failed to delete file record');
    }

    return { success: true, message: 'File deleted successfully' };

  } catch (error) {
    console.error('DELETE error:', error);
    throw error;
  }
}

// Additional utility function to get file URL
export async function getFileUrl(filename: string): Promise<string> {
  // Check if the file exists first
  const exists = await checkFileExists(filename);
  if (!exists) {
    throw new Error('File not found in R2 storage');
  }
  
  // Return the correct URL format for your R2 bucket
  return `https://media.stridecampus.com/${encodeURIComponent(filename)}`;
}

// Additional utility function to check if file exists in R2
export async function checkFileExists(filename: string): Promise<boolean> {
  try {
    const response = await fetch(`${R2_API_URL}/files/${filename}`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
}

export async function getFileById(fileId: string) {
  try {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    // Query Supabase for the specific file with user information
    const { data, error } = await supabase
      .from('library')
      .select(`
        *,
        users (
          full_name,
          school_name,
          username,
          checkmark
        )
      `)
      .eq('id', fileId)
      .single(); // Use single() since we expect only one result

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') {
        // No rows returned
        throw new Error('File not found');
      }
      throw new Error('Failed to retrieve file');
    }

    if (!data) {
      throw new Error('File not found');
    }

    return data;

  } catch (error) {
    console.error('getFileById error:', error);
    throw error;
  }
}

export async function getUserFiles(
  userId: string,
  options: {
    search?: string;
    category?: string;
    subject?: string;
    resourceType?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  try {
    const {
      search,
      category,
      subject,
      resourceType,
      page = 1,
      limit = 20
    } = options;

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Build query to list files from Supabase for the specific user
    let query = supabase
      .from('library')
      .select(`
        *,
        users (
          full_name,
          username,
          school_name,
          checkmark
        )
      `, { count: 'exact' })
      .eq('user_id', userId) // Filter by the specific user
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`original_name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    if (category && category !== 'all') {
      query = query.eq('file_category', category);
    }

    if (subject && subject !== 'all') {
      query = query.eq('subject', subject);
    }

    if (resourceType && resourceType !== 'all') {
      query = query.eq('resource_type', resourceType);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to retrieve user files');
    }

    return {
      files: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };

  } catch (error) {
    console.error('GET user files error:', error);
    throw error;
  }
}