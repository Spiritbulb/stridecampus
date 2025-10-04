// PostForm.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Space } from '@/utils/supabaseClient';
import { LibraryFile } from '@/components/library/types';
import { 
  FileText, Plus, X, ChevronDown, 
  Hash, AlignLeft, Paperclip, Globe, AtSign, Link2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import ResourceSelector from '@/components/feed/ResourceSelector';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

interface PostFormProps {
  spaces: Space[];
  initialSpaceId?: string;
  onSuccess: () => void;
  onCreateSpace: () => void;
}

interface HashtagSuggestion {
  id: string;
  name: string;
  usage_count?: number;
}

interface UserMention {
  id: string;
  username: string;
  display_name?: string;
}

export default function PostForm({ 
  spaces, 
  initialSpaceId, 
  onSuccess, 
  onCreateSpace 
}: PostFormProps) {
  const { user: appUser } = useApp();
const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpaceDropdown, setShowSpaceDropdown] = useState(false);
  const [showResourceSelector, setShowResourceSelector] = useState(false);
  
  const [formData, setFormData] = useState({
    content: '',
    spaceId: initialSpaceId || spaces.find(s => s.name === 'stride')?.id || '',
    linkUrls: [] as string[] // Changed from isLinkPost and linkUrl to array
  });

  const [selectedResources, setSelectedResources] = useState<LibraryFile[]>([]);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<HashtagSuggestion[]>([]);
  const [userSuggestions, setUserSuggestions] = useState<UserMention[]>([]);
  const [showingSuggestions, setShowingSuggestions] = useState<'hashtags' | 'users' | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const selectedSpace = spaces.find(s => s.id === formData.spaceId);

  // Function to extract URLs from content
  const extractUrls = (content: string): string[] => {
    const urlRegex = /https?:\/\/[^\s<>"]+|www\.[^\s<>"]+/g;
    const matches = content.match(urlRegex) || [];
    
    // Normalize URLs (add https if starts with www)
    return matches.map(url => {
      if (url.startsWith('www.')) {
        return 'https://' + url;
      }
      return url;
    });
  };

  // Update linkUrls whenever content changes
  useEffect(() => {
    const urls = extractUrls(formData.content);
    setFormData(prev => ({
      ...prev,
      linkUrls: urls
    }));
  }, [formData.content]);

  // Generate dynamic title from content
  const generateTitle = (content: string): string => {
    if (!content.trim()) return `Post from @${user?.username}`;
    
    // Extract first meaningful line (up to 50 chars)
    const firstLine = content.trim().split('\n')[0];
    if (firstLine.length <= 50) return firstLine;
    
    // Truncate and add ellipsis
    return firstLine.substring(0, 47) + '...';
  };

  // Extract hashtags from content
  const extractHashtags = (content: string): string[] => {
    const hashtagRegex = /#[\w\u00C0-\u017F]+/g;
    const matches = content.match(hashtagRegex) || [];
    return matches.map(tag => tag.substring(1).toLowerCase());
  };

  // Extract user mentions from content
  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@[\w\u00C0-\u017F]+/g;
    const matches = content.match(mentionRegex) || [];
    return matches.map(mention => mention.substring(1).toLowerCase());
  };

  // Handle content change and trigger suggestions
  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    
    setFormData(prev => ({ ...prev, content: value }));
    setCursorPosition(position);

    // Check for hashtag or mention trigger
    const textBeforeCursor = value.substring(0, position);
    const lastWord = textBeforeCursor.split(/\s/).pop() || '';

    if (lastWord.startsWith('#') && lastWord.length > 1) {
      await fetchHashtagSuggestions(lastWord.substring(1));
      setShowingSuggestions('hashtags');
    } else if (lastWord.startsWith('@') && lastWord.length > 1) {
      await fetchUserSuggestions(lastWord.substring(1));
      setShowingSuggestions('users');
    } else {
      setShowingSuggestions(null);
    }
  };

  // Fetch hashtag suggestions
  const fetchHashtagSuggestions = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('hashtags')
        .select('id, name, usage_count')
        .ilike('name', `${query}%`)
        .order('usage_count', { ascending: false })
        .limit(5);

      if (error) throw error;
      setHashtagSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching hashtag suggestions:', error);
      setHashtagSuggestions([]);
    }
  };

  // Fetch user mention suggestions
  const fetchUserSuggestions = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name')
        .or(`username.ilike.${query}%,full_name.ilike.${query}%`)
        .limit(5);

      if (error) throw error;
      setUserSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching user suggestions:', error);
      setUserSuggestions([]);
    }
  };

  // Insert suggestion into content
  const insertSuggestion = (suggestion: string, type: 'hashtag' | 'user') => {
    if (!contentRef.current) return;

    const content = formData.content;
    const position = cursorPosition;
    const textBeforeCursor = content.substring(0, position);
    const textAfterCursor = content.substring(position);
    
    const words = textBeforeCursor.split(/\s/);
    const currentWord = words[words.length - 1];
    const wordStart = textBeforeCursor.lastIndexOf(currentWord);
    
    const prefix = type === 'hashtag' ? '#' : '@';
    const newContent = 
      content.substring(0, wordStart) + 
      prefix + suggestion + ' ' + 
      textAfterCursor;

    setFormData(prev => ({ ...prev, content: newContent }));
    setShowingSuggestions(null);
    
    setTimeout(() => {
      if (contentRef.current) {
        const newPosition = wordStart + prefix.length + suggestion.length + 1;
        contentRef.current.focus();
        contentRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const addResource = (resource: LibraryFile) => {
    if (!selectedResources.find(r => r.id === resource.id)) {
      setSelectedResources([...selectedResources, resource]);
    }
    setShowResourceSelector(false);
  };

  const removeResource = (resourceId: string) => {
    setSelectedResources(selectedResources.filter(r => r.id !== resourceId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !appUser) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a post',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please add some content to your post',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.spaceId) {
      toast({
        title: 'Community required',
        description: 'Please select a community for your post',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate dynamic title
      const dynamicTitle = generateTitle(formData.content);
      
      // Extract hashtags and mentions
      const hashtags = extractHashtags(formData.content);
      const mentions = extractMentions(formData.content);

      // Create the post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          title: dynamicTitle,
          content: formData.content.trim(),
          space_id: formData.spaceId,
          author_id: user.id,
          is_link_post: formData.linkUrls.length > 0, // Set to true if there are links
          link_url: formData.linkUrls.length > 0 ? formData.linkUrls : null // Use the array
        })
        .select()
        .single();

      if (postError) throw postError;

      // Handle hashtags
      if (hashtags.length > 0) {
        for (const tagName of hashtags) {
          const { data: existingTag, error: tagCheckError } = await supabase
            .from('hashtags')
            .select('id')
            .eq('name', tagName)
            .single();

          if (tagCheckError && tagCheckError.code !== 'PGRST116') {
            console.error('Error checking hashtag:', tagCheckError);
            continue;
          }

          let tagId;
          if (existingTag) {
            tagId = existingTag.id;
            const { data: currentTag } = await supabase
              .from('hashtags')
              .select('usage_count')
              .eq('id', tagId)
              .single();
              
            const newCount = (currentTag?.usage_count || 0) + 1;
            await supabase
              .from('hashtags')
              .update({ usage_count: newCount })
              .eq('id', tagId);
          } else {
            const { data: newTag, error: newTagError } = await supabase
              .from('hashtags')
              .insert({ name: tagName, usage_count: 1 })
              .select('id')
              .single();

            if (newTagError) {
              console.error('Error creating hashtag:', newTagError);
              continue;
            }
            tagId = newTag.id;
          }

          await supabase
            .from('post_hashtags')
            .insert({ post_id: post.id, hashtag_id: tagId });
        }
      }

      // Handle user mentions
      if (mentions.length > 0) {
        const { data: mentionedUsers } = await supabase
          .from('users')
          .select('id, username')
          .in('username', mentions);

        if (mentionedUsers) {
          const mentionInserts = mentionedUsers.map(mentionedUser => ({
            post_id: post.id,
            mentioned_user_id: mentionedUser.id,
            mentioner_user_id: user.id
          }));

          await supabase
            .from('post_mentions')
            .insert(mentionInserts);
        }
      }

      // Add resource tags if any
      if (selectedResources.length > 0) {
        const resourceTags = selectedResources.map(resource => ({
          post_id: post.id,
          library_id: resource.id
        }));

        const { error: tagError } = await supabase
          .from('resource_tags')
          .insert(resourceTags);

        if (tagError) throw tagError;
      }

      // Reset form
      setFormData({
        content: '',
        spaceId: initialSpaceId || spaces.find(s => s.name === 'stride')?.id || '',
        linkUrls: []
      });
      setSelectedResources([]);
      
      onSuccess();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData.content.trim() && formData.spaceId;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Community selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowSpaceDropdown(!showSpaceDropdown)}
          className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              {selectedSpace ? (
                <Hash size={16} className="text-gray-600" />
              ) : (
                <Globe size={16} className="text-gray-400" />
              )}
            </div>
            <span className="font-medium text-gray-900">
              {selectedSpace ? selectedSpace.display_name || selectedSpace.name : 'Choose a community'}
            </span>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </button>

        {showSpaceDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
            {spaces.map(space => (
              <button
                key={space.id}
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, spaceId: space.id }));
                  setShowSpaceDropdown(false);
                }}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Hash size={16} className="text-gray-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {space.display_name || space.name}
                  </div>
                  {space.description && (
                    <div className="text-sm text-gray-500 truncate">
                      {space.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
            
            <button
              type="button"
              onClick={() => {
                onCreateSpace();
                setShowSpaceDropdown(false);
              }}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              <div className="w-8 h-8 bg-[#f23b36] rounded-full flex items-center justify-center">
                <Plus size={16} className="text-white" />
              </div>
              <span className="font-medium text-[#f23b36]">Create new community</span>
            </button>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="relative">
        <textarea
          ref={contentRef}
          value={formData.content}
          onChange={handleContentChange}
          placeholder="What's on your mind? Use #hashtags and @mentions to engage with others. Links will be automatically detected."
          className="w-full min-h-[120px] p-4 text-base border border-gray-200 rounded-lg focus:border-[#f23b36] focus:outline-none transition-colors resize-none"
          maxLength={2000}
        />
        
        {/* Suggestions dropdown */}
        {showingSuggestions && (
          <div className="absolute top-full left-4 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-48">
            {showingSuggestions === 'hashtags' && hashtagSuggestions.length > 0 && (
              <>
                {hashtagSuggestions.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => insertSuggestion(tag.name, 'hashtag')}
                    className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Hash size={14} className="text-[#f23b36]" />
                    <span>#{tag.name}</span>
                    {tag.usage_count && (
                      <span className="text-xs text-gray-400 ml-auto">{tag.usage_count}</span>
                    )}
                  </button>
                ))}
              </>
            )}
            
            {showingSuggestions === 'users' && userSuggestions.length > 0 && (
              <>
                {userSuggestions.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => insertSuggestion(user.username, 'user')}
                    className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <AtSign size={14} className="text-[#f23b36]" />
                    <div>
                      <div className="font-medium">@{user.username}</div>
                      {user.display_name && (
                        <div className="text-sm text-gray-500">{user.display_name}</div>
                      )}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        <div className="flex justify-between mt-2">
          {/* Show detected links */}
          {formData.linkUrls.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link2 size={14} />
              <span>Detected {formData.linkUrls.length} link{formData.linkUrls.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          <span className={`text-sm ${formData.content.length > 1800 ? 'text-red-500' : 'text-gray-400'}`}>
            {formData.content.length}/2000
          </span>
        </div>
      </div>

      {/* Resources */}
      {selectedResources.length > 0 && (
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <div className="text-sm font-medium text-gray-700">Attached resources</div>
          {selectedResources.map(resource => (
            <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-gray-600" />
                <span className="text-sm text-gray-900">{resource.original_name}</span>
              </div>
              <button
                type="button"
                onClick={() => removeResource(resource.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowResourceSelector(true)}
            className="p-2 text-gray-500 hover:text-[#f23b36] hover:bg-gray-100 rounded-lg transition-colors"
            title="Attach resource"
          >
            <Paperclip size={18} />
          </button>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="px-6 py-2 bg-[#f23b36] text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e12e29] transition-colors"
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>

      {/* Resource selector modal */}
      {showResourceSelector && (
        <ResourceSelector
          onSelect={addResource}
          onClose={() => setShowResourceSelector(false)}
          excludedResources={selectedResources.map(r => r.id)}
        />
      )}
    </form>
  );
}