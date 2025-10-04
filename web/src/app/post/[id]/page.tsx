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
import PostContent from '@/components/feed/main/PostContent';
import PostCard from '@/components/feed/main/PostCard';
import PostHeader from '@/components/feed/main/PostHeader';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

export default function PostPage() {
  const params = useParams();
  // Ensure id is a string (it could be an array in some cases)
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { user: appUser } = useApp();
const { user, loading: userLoading } = useSupabaseUser(appUser?.email || null);
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
    if (!user || !appUser) {
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
        .eq('user_id', user?.id)
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
          .eq('user_id', user?.id);

        if (error) throw error;
      } else {
        // Create new vote
        const { error } = await supabase
          .from('post_votes')
          .insert({
            post_id: postId,
            user_id: user?.id,
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
          user_id: user?.id || null || appUser?.id
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

  if (!postData || !user || !appUser) {
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
        <PostHeader post={postData} user={user || appUser}/>
        <PostContent post={postData}/>
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