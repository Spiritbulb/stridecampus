import { supabase } from './supabaseClient';

export async function uploadYoutubeLink(
  youtubeUrl: string,
  userId: string,
  description: string,
  tags: string,
  subject: string
) {
  try {
    // Validate YouTube URL format
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(youtubeUrl)) {
      throw new Error('Invalid YouTube URL format');
    }

    // Extract video ID from various YouTube URL formats
    const videoId = extractYoutubeVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Could not extract video ID from URL');
    }

    // Optionally validate the video exists by checking with YouTube API
    // This is optional but recommended for better user experience
    const isValidVideo = await validateYoutubeVideo(videoId);
    if (!isValidVideo) {
      throw new Error('YouTube video not found or unavailable');
    }

    // Prepare tags array
    const tagsArray = tags
      ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    // Insert into Supabase
    const { data, error } = await supabase
      .from('library')
      .insert({
        user_id: userId,
        youtube_url: youtubeUrl,
        description: description || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        subject: subject,
        resource_type: 'youtube',
        // These fields are null for YouTube resources
        filename: null,
        original_name: `YouTube Video: ${videoId}`,
        file_type: 'video/youtube',
        file_size: 0,
        file_category: 'video',
        storage_path: null
      })
      .select(`
        *,
        users (
          full_name,
          school_name,
          username,
          checkmark
        )
      `)
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message || 'Failed to save YouTube link to database');
    }

    return data;

  } catch (error: any) {
    console.error('Error uploading YouTube link:', error);
    throw error;
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

// Optional function to validate YouTube video exists
async function validateYoutubeVideo(videoId: string): Promise<boolean> {
  try {
    // You can implement this using YouTube Data API if you have an API key
    // For now, we'll use a simple oembed check which doesn't require an API key
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (response.ok) {
      return true;
    }
    
    // If oembed fails, try a simple HEAD request to the video URL
    const headResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { method: 'HEAD' });
    return headResponse.ok;
    
  } catch (error) {
    console.warn('YouTube validation failed, proceeding anyway:', error);
    // If validation fails, we'll still allow the upload but log the issue
    return true;
  }
}

// Configuration - update with your R2 API worker URL
const R2_API_URL = 'https://stride-media-api.spiritbulb.workers.dev';

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
  return 'other';
}

// Upload file to R2 via API worker and save metadata to Supabase
// In your r2.ts utility file
export async function uploadFile(file: File, userId: string, description: string = '', tags: string = '', subject: string = '') {
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

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    
    // Prepare form data for R2 API worker - use the same filename
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', uniqueFilename); // Use the same filename
    formData.append('metadata', JSON.stringify({
      userId,
      subject,
      description,
      tags,
      originalName: file.name // Include original name in metadata
    }));

    // Upload to R2 via API worker
    const uploadResponse = await fetch(`${R2_API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      throw new Error((errorData as { error?: string }).error || 'Failed to upload file to R2');
    }

    const r2Result = await uploadResponse.json();

    // Save metadata to Supabase - using the SAME filename
    const { data, error } = await supabase
      .from('library')
      .insert({
        user_id: userId,
        filename: uniqueFilename, // Same as R2 filename
        original_name: file.name,
        file_type: file.type,
        file_size: file.size,
        resource_type: 'file',
        file_category: getFileCategory(file.type),
        description: description,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        subject: subject,
        storage_path: uniqueFilename, // Same as R2 filename
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
        users (
          full_name,
          school_name
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
          school_name,
          username,
          checkmark
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // If userId is provided, filter by user; otherwise get all files
    if (userId) {
      query = query.eq('user_id', userId);
    }

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
// In your r2.ts utility file
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