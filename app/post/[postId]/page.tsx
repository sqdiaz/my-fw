import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

interface Props {
  params: { postId: string };
}

interface Comment {
  id: string;
  content: string;
  author_hash: string;
  created_at: string;
  parent_id: string | null;
  upvotes: number;
}

function CommentNode({ comment, allComments, depth = 0 }: { comment: Comment, allComments: Comment[], depth?: number }) {
  const children = allComments.filter(c => c.parent_id === comment.id);

  return (
    <div className={`mt-4 ${depth > 0 ? 'ml-6 border-l border-gray-200 pl-4' : ''}`}>
      <div className="text-[11px] text-gray-500 mb-1 flex items-center gap-2">
        <span className="font-bold text-gray-700">ID: {comment.author_hash?.substring(0, 8)}</span>
        <span>•</span>
        <span>{new Date(comment.created_at).toLocaleString()}</span>
      </div>
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      
      <details className="mt-2 group">
        <summary className="text-[10px] text-blue-600 cursor-pointer hover:underline list-none">
          reply
        </summary>
        <form action="/api/comment" method="POST" className="mt-2 max-w-lg">
          <input type="hidden" name="parent_id" value={comment.id} />
          <textarea 
            name="content" 
            required
            className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-blue-500 h-20"
            placeholder="Write a reply..."
          ></textarea>
          <button type="submit" className="mt-1 bg-gray-100 border border-gray-400 px-2 py-0.5 text-[10px] font-bold hover:bg-gray-200">
            post reply
          </button>
        </form>
      </details>

      {children.map(child => (
        <CommentNode key={child.id} comment={child} allComments={allComments} depth={depth + 1} />
      ))}
    </div>
  );
}

export default async function PostPage({ params }: Props) {
  const { postId } = params;

  // Fetch the main post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (postError || !post) {
    return <div className="p-8 text-center">Post not found.</div>;
  }

  // Fetch all comments in this thread (recursively is handled in-memory for simplicity here)
  const { data: comments } = await supabase
    .from('posts')
    .select('*')
    .not('parent_id', 'is', null)
    .order('created_at', { ascending: true });

  // Simple recursive filter for this thread
  const buildThread = (parentId: string, list: Comment[]): Comment[] => {
    const direct = list.filter(c => c.parent_id === parentId);
    let results = [...direct];
    for (const child of direct) {
      results = [...results, ...buildThread(child.id, list)];
    }
    return results;
  };

  const threadComments = comments ? buildThread(postId, comments) : [];
  const rootComments = threadComments.filter(c => c.parent_id === postId);

  return (
    <div className="bg-white border border-gray-400 shadow-sm min-h-screen">
       <div className="bg-[#ff6600] p-1 px-2 font-bold text-black border-b border-gray-400 flex items-center gap-2">
        <Link href={`/${post.university_slug || ''}`} className="hover:underline">← Back</Link>
        <span className="truncate">Thread</span>
      </div>

      <div className="p-4 border-b border-gray-200">
        {post.title && <h1 className="text-lg font-bold text-blue-900 leading-tight mb-2">{post.title}</h1>}
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        <div className="mt-4 text-xs text-gray-500 flex items-center gap-3">
          <span className="font-bold">ID: {post.author_hash?.substring(0, 8)}</span>
          <span>{new Date(post.created_at).toLocaleString()}</span>
        </div>

        {/* Initial Reply Box */}
        <div className="mt-6">
          <form action="/api/comment" method="POST" className="max-w-xl">
            <input type="hidden" name="parent_id" value={post.id} />
            <input type="hidden" name="university_slug" value={post.university_slug} />
            <textarea 
              name="content" 
              required
              className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-blue-500 h-24"
              placeholder="What are your thoughts?"
            ></textarea>
            <button type="submit" className="mt-2 bg-gray-100 border border-gray-400 px-4 py-1 text-xs font-bold hover:bg-gray-200">
              add comment
            </button>
          </form>
        </div>
      </div>

      <div className="p-4 bg-gray-50">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Comments</h2>
        {rootComments.length === 0 && <p className="text-sm text-gray-400 italic">No comments yet.</p>}
        {rootComments.map(comment => (
          <CommentNode key={comment.id} comment={comment} allComments={threadComments} />
        ))}
      </div>
    </div>
  );
}
