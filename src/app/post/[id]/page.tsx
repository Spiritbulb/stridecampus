'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/utils/supabaseClient';
import { Post, Comment } from '@/utils/supabaseClient';
import { 
  ArrowUp, 
  ArrowDown, 
  Share, 
  Bookmark, 
  MessageSquare,
  Link as LinkIcon,
  FileText,
  ArrowLeft,
  MoreHorizontal
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import CommentSection from '@/components/feed/CommentSection';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';

export default function PostPage() {
  const params = useParams();
  // Ensure id is a string (it could be an array in some cases)
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { user } = useApp();
  const [postData, setPostData] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostLoading, setIsPostLoading] = useState(true);
  const checkmarkImg = <img src="/check.png" alt="Verified" className="inline mb-1 w-3 h-3 ml-0.5" />;

  useEffect(() => {
    if (id) {
      fetchPostDetails();
    } else {
      setIsLoading(false);
      setIsPostLoading(false);
    }
  }, [id]);

  // Fetch comments after post data is loaded
  useEffect(() => {
    if (postData?.id) {
      fetchComments();
    }
  }, [postData?.id]);

  const fetchPostDetails = async () => {
    try {
      setIsPostLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users(full_name, avatar_url, username, checkmark),
          space:spaces(name, display_name, id),
          vote_count:post_votes(count),
          comment_count:comments(count),
          share_count:post_shares(count),
          user_vote:post_votes(vote_type),
          resource_tags:resource_tags(resource:library(*))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Process the data
      const processedPost = {
        ...data,
        vote_count: data.vote_count?.[0]?.count || 0,
        comment_count: data.comment_count?.[0]?.count || 0,
        share_count: data.share_count?.[0]?.count || 0,
        user_vote: data.user_vote?.[0]?.vote_type || 0,
        resource_tags: data.resource_tags?.map((rt: any) => rt.resource) || []
      };

      setPostData(processedPost);
    } catch (error) {
      console.error('Error fetching post details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load post',
        variant: 'destructive'
      });
    } finally {
      setIsPostLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!postData?.id) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:users(full_name, avatar_url, username, checkmark),
          vote_count:comment_votes(count),
          user_vote:comment_votes(vote_type),
          resource_tags:resource_tags(resource:library(*))
        `)
        .eq('post_id', postData.id)
        .is('parent_id', null) // Only top-level comments
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process comments
      const processedComments = (data || []).map(comment => ({
        ...comment,
        vote_count: comment.vote_count?.[0]?.count || 0,
        user_vote: comment.user_vote?.[0]?.vote_type || 0,
        replies: [] // Will be populated if needed
      }));

      setComments(processedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (postId: string, voteType: number) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to vote',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('post_votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      let newVoteType = voteType;

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // If clicking the same vote button again, remove the vote
          newVoteType = 0;
        }
        
        // Update existing vote
        const { error } = await supabase
          .from('post_votes')
          .update({ vote_type: newVoteType })
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new vote
        const { error } = await supabase
          .from('post_votes')
          .insert({
            post_id: postId,
            user_id: user.id,
            vote_type: voteType
          });

        if (error) throw error;
      }

      // Update local state
      if (postData) {
        setPostData({
          ...postData,
          vote_count: (postData.vote_count ?? 0) + (newVoteType - (existingVote?.vote_type || 0)),
          user_vote: newVoteType
        });
      }

      toast({
        title: newVoteType === 1 ? 'Upvoted!' : newVoteType === -1 ? 'Downvoted!' : 'Vote removed',
        variant: 'default'
      });

    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to register vote',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async (postId: string) => {
    try {
      // Create share record
      const { error } = await supabase
        .from('post_shares')
        .insert({
          post_id: postId,
          user_id: user?.id || null
        });

      if (error) throw error;

      // Copy post URL to clipboard
      const postUrl = `${window.location.origin}/post/${id}`;
      await navigator.clipboard.writeText(postUrl);

      // Update local state
      if (postData) {
        setPostData({
          ...postData,
          share_count: (postData.share_count ?? 0) + 1
        });
      }

      toast({
        title: 'Link copied to clipboard!',
        description: 'Post link has been shared.',
        variant: 'default'
      });

    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: 'Error',
        description: 'Failed to share post',
        variant: 'destructive'
      });
    }
  };

  const handleCommentAdded = () => {
    fetchPostDetails(); // Refresh comment count
    fetchComments(); // Refresh comments list
  };

  if (isPostLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-[#f23b36] text-white rounded-md hover:bg-[#e02a25] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        {/* Post content */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center text-sm text-gray-500 flex-wrap">
              <Link 
                href={`/spaces/${postData.space?.id}`}
                className="font-medium text-[#f23b36] hover:underline"
              >
                {postData.space?.display_name}
              </Link>
              <span className="mx-1 hidden sm:inline">•</span>
              <div className="flex items-center mt-1 sm:mt-0">
                <img 
                  src={postData.author?.avatar_url || '/default-avatar.png'} 
                  alt="Avatar" 
                  className="w-5 h-5 rounded-full mr-1" 
                />
                <Link 
                  href={`/u/${postData.author?.username}`}
                  className="hover:underline text-gray-700"
                >
                  <span>{postData.author?.full_name}</span>
                  {postData.author?.checkmark && checkmarkImg}
                </Link>
              </div>
              <span className="mx-1 hidden sm:inline">•</span>
              <span className="mt-1 sm:mt-0">{formatDistanceToNow(new Date(postData.created_at))} ago</span>
            </div>
            
            <button className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">{postData.title}</h1>
          
          {postData.content && (
            <div className="text-gray-800 mb-6 whitespace-pre-wrap leading-relaxed">{postData.content}</div>
          )}
          
          {postData.is_link_post && postData.link_url && (
            <div className="flex items-center text-blue-500 mb-6">
              <LinkIcon size={18} className="mr-2 flex-shrink-0" />
              <a 
                href={postData.link_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline break-words text-sm sm:text-base"
              >
                {postData.link_url}
              </a>
            </div>
          )}

          {/* Resource tags */}
          {postData.resource_tags && postData.resource_tags.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center text-sm text-gray-700 mb-2">
                <FileText size={16} className="mr-2" />
                <span>Attached resources:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {postData.resource_tags.map(resource => (
                  <a
                    key={resource.id}
                    href={`https://media.stridecampus.com/${resource.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full hover:bg-blue-100 transition-colors border border-blue-100"
                  >
                    {resource.original_name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Post actions */}
          <div className="flex items-center gap-4 text-gray-500 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleVote(postData.id, 1)}
                className={`p-1.5 rounded-md transition-colors ${postData.user_vote === 1 ? 'text-[#f23b36] bg-white shadow-sm' : 'text-gray-500 hover:text-[#f23b36] hover:bg-gray-50'}`}
              >
                <ArrowUp size={18} />
              </button>
              <span className="text-sm font-medium min-w-[2rem] text-center text-gray-700">{postData.vote_count}</span>
              <button
                onClick={() => handleVote(postData.id, -1)}
                className={`p-1.5 rounded-md transition-colors ${postData.user_vote === -1 ? 'text-blue-500 bg-white shadow-sm' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-50'}`}
              >
                <ArrowDown size={18} />
              </button>
            </div>

            <button className="flex items-center gap-1.5 hover:bg-gray-100 p-1.5 rounded-md transition-colors">
              <MessageSquare size={18} />
              <span className="text-sm">{postData.comment_count}</span>
            </button>

            <button 
              onClick={() => handleShare(postData.id)}
              className="flex items-center gap-1.5 hover:bg-gray-100 p-1.5 rounded-md transition-colors"
            >
              <Share size={18} />
              <span className="text-sm">{postData.share_count}</span>
            </button>

            <button className="flex items-center gap-1.5 hover:bg-gray-100 p-1.5 rounded-md transition-colors">
              <Bookmark size={18} />
              <span className="text-sm hidden sm:inline">Save</span>
            </button>
          </div>
        </div>

        {/* Comment section */}
        <CommentSection
          postId={postData.id}
          comments={comments}
          isLoading={isLoading}
          onCommentAdded={handleCommentAdded}
        />
      </div>
    </div>
  );
}