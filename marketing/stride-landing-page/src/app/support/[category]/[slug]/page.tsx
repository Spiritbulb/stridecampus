import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { getContent, getDirectory } from '@/lib/github-content';

interface SupportPageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

// Generate static params at build time
export async function generateStaticParams() {
  const categories = await getDirectory('support');
  
  const params = [];
  
  for (const category of categories) {
    if (category.type === 'dir') {
      const docs = await getDirectory(`support/${category.name}`);
      for (const doc of docs) {
        if (doc.type === 'file' && doc.name.endsWith('.md')) {
          params.push({
            category: category.name,
            slug: doc.name.replace('.md', ''),
          });
        }
      }
    }
  }
  
  return params;
}

export const dynamic = 'force-static';

async function getSupportDoc(category: string, slug: string) {
  try {
    const markdownContent = await getContent(`support/${category}/${slug}`);
    
    if (!markdownContent) {
      return null;
    }

    // Parse frontmatter and content
    const matter = await import('gray-matter');
    const { data: frontMatter, content } = matter.default(markdownContent);

    return {
      title: frontMatter.title || slug,
      content,
      frontMatter,
      slug,
      category,
    };
  } catch (error) {
    console.error(`Failed to load support doc: support/${category}/${slug}.md`, error);
    return null;
  }
}

async function getAllSupportDocs(category: string) {
  try {
    const docs = await getDirectory(`support/${category}`);
    
    const supportDocs = await Promise.all(
      docs
        .filter(doc => doc.type === 'file' && doc.name.endsWith('.md'))
        .map(async (doc) => {
          const slug = doc.name.replace('.md', '');
          const supportDoc = await getSupportDoc(category, slug);
          return supportDoc;
        })
    );

    return supportDocs
      .filter(Boolean)
      .sort((a, b) => (a!.frontMatter.order || 0) - (b!.frontMatter.order || 0));
  } catch (error) {
    console.error(`Failed to get docs for category: ${category}`, error);
    return [];
  }
}

export default async function SupportPage({ params }: SupportPageProps) {
  const { category, slug } = await params;
  
  // Try to load the markdown file from GitHub
  const support = await getSupportDoc(category, slug);
  
  if (!support) {
    notFound();
  }

  // Get all docs for navigation
  const allDocs = await getAllSupportDocs(category);
  const currentIndex = allDocs.findIndex(d => d?.slug === slug);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  const priority = support.frontMatter.priority || 'medium';

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">High Priority</span>;
      case 'medium':
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">Medium Priority</span>;
      case 'low':
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">Low Priority</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <div className="mb-8">
          <Link 
            href="/support" 
            className="inline-flex items-center text-[#f23b36] hover:text-[#d32f2f] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Support Center
          </Link>
        </div>

        {/* Article Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {getPriorityIcon(priority)}
            <h1 className="text-4xl font-bold text-gray-900">{support.title}</h1>
            <div className="ml-auto">
              {getPriorityBadge(priority)}
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span>Support</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{category.replace(/-/g, ' ')}</span>
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-4xl font-bold text-gray-900 mb-6 mt-8 first:mt-0">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8 pb-2 border-b border-gray-200">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-2xl font-bold text-gray-900 mb-3 mt-6">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-gray-700 leading-7 mb-4">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-6 my-6 space-y-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 my-6 space-y-2">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-gray-700 leading-7">{children}</li>
              ),
              a: ({ children, href }) => (
                <a href={href} className="text-[#f23b36] font-medium no-underline hover:underline">{children}</a>
              ),
              strong: ({ children }) => (
                <strong className="text-gray-900 font-semibold">{children}</strong>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="text-[#f23b36] bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  );
                }
                return (
                  <code className={className}>
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-[#f23b36] pl-4 italic text-gray-600 my-6">
                  {children}
                </blockquote>
              ),
              hr: () => (
                <hr className="my-8 border-gray-200" />
              ),
              table: ({ children }) => (
                <div className="my-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-gray-50">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{children}</th>
              ),
              td: ({ children }) => (
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">{children}</td>
              ),
            }}
          >
            {support.content}
          </ReactMarkdown>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-4">
          {prevDoc ? (
            <Link 
              href={`/support/${category}/${prevDoc.slug}`}
              className="inline-flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-[#f23b36] transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="truncate">{prevDoc.title}</span>
            </Link>
          ) : (
            <div></div>
          )}

          {nextDoc && (
            <Link 
              href={`/support/${category}/${nextDoc.slug}`}
              className="inline-flex items-center px-6 py-3 bg-[#f23b36] text-white rounded-lg hover:bg-[#d32f2f] transition-colors text-sm font-medium ml-auto"
            >
              <span className="truncate">{nextDoc.title}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          )}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-gradient-to-r from-[#f23b36] to-[#d32f2f] rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-lg mb-6 opacity-90">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="mailto:support@stridecampus.com"
              className="px-6 py-3 bg-white text-[#f23b36] rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              Email Support
            </Link>
            <Link 
              href="/contact"
              className="px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
            >
              Live Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}