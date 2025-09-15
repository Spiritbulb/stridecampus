'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabaseClient';
import { Post, Comment } from '@/utils/supabaseClient';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  Share, 
  Bookmark, 
  MessageSquare,
  Link,
  FileText,
    User2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import CommentSection from './CommentSection';

interface PostDetailModalProps {
  post: Post;
  onClose: () => void;
  onVote: (postId: string, voteType: number) => void;
  onShare: (postId: string) => void;
}

export default function PostDetailModal({ post, onClose, onVote, onShare }: PostDetailModalProps) {
  const { user } = useAuth();
  const [postData, setPostData] = useState<Post>(post);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const checkmarkImg = <img src="/check.png" alt="Verified" className="inline mb-1 w-3 h-3 ml-0.5" />;

  useEffect(() => {
    fetchPostDetails();
    fetchComments();
  }, [post.id]);

  const fetchPostDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users(full_name, avatar_url),
          space:spaces(name, display_name),
          vote_count:post_votes(count),
          comment_count:comments(count),
          share_count:post_shares(count),
          user_vote:post_votes(vote_type),
          resource_tags:resource_tags(resource:files(*))
        `)
        .eq('id', post.id)
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
    }
  };

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:users(full_name, avatar_url),
          vote_count:comment_votes(count),
          user_vote:comment_votes(vote_type),
          resource_tags:resource_tags(resource:files(*))
        `)
        .eq('post_id', post.id)
        .is('parent_id', null) // Only top-level comments
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process comments
      const processedComments = (data || []).map(comment => ({
        ...comment,
        vote_count: comment.vote_count?.[0]?.count || 0,
        user_vote: comment.user_vote?.[0]?.vote_type || 0,
        resource_tags: comment.resource_tags?.map((rt: any) => rt.resource) || [],
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

  const handleCommentAdded = () => {
    fetchPostDetails(); // Refresh comment count
    fetchComments(); // Refresh comments list
  };

  return (
    <div className="fixed inset-0 flex backdrop-blur items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl my-8">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">Post details</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
          {/* Post content */}
          <div className="p-6 border-b">
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <span className="font-medium text-gray-900">{postData.space?.display_name}</span>
              <span className="mx-1">•</span>
              <img src={postData.author?.avatar_url || ''} alt="Avatar" className="w-5 h-5 rounded-full mr-1" />
              <a href={`/u/${postData.author?.username}`} className="hover:underline">
              <span>{postData.author?.full_name}</span>{ postData.author?.checkmark && checkmarkImg }
                </a>
              <span className="mx-1">•</span>
              <span>{formatDistanceToNow(new Date(postData.created_at))} ago</span>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 mb-4">{postData.title}</h1>
            
            {postData.content && (
              <div className="text-gray-800 mb-6 whitespace-pre-wrap">{postData.content}</div>
            )}
            
            {postData.is_link_post && postData.link_url && (
              <div className="flex items-center text-blue-500 mb-6">
                <Link size={18} className="mr-2" />
                <a 
                  href={postData.link_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline break-all"
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
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200 transition-colors"
                    >
                      {resource.original_name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Post actions */}
            <div className="flex items-center gap-4 text-gray-500">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onVote(postData.id, 1)}
                  className={`p-1 rounded hover:bg-gray-100 ${postData.user_vote === 1 ? 'text-[#f23b36]' : 'text-gray-500'}`}
                >
                  <ArrowUp size={20} />
                </button>
                <span className="text-sm font-medium min-w-[2rem] text-center">{postData.vote_count}</span>
                <button
                  onClick={() => onVote(postData.id, -1)}
                  className={`p-1 rounded hover:bg-gray-100 ${postData.user_vote === -1 ? 'text-blue-500' : 'text-gray-500'}`}
                >
                  <ArrowDown size={20} />
                </button>
              </div>

              <button className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded">
                <MessageSquare size={18} />
                <span className="text-sm">{postData.comment_count} Comments</span>
              </button>

              <button 
                onClick={() => onShare(postData.id)}
                className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded"
              >
                <Share size={18} />
                <span className="text-sm">{postData.share_count} Shares</span>
              </button>

              <button className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded">
                <Bookmark size={18} />
                <span className="text-sm">Save</span>
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
    </div>
  );
}