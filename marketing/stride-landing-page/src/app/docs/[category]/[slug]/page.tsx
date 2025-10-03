import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getMarkdownDocument, getAllMarkdownDocuments, getAllDocumentPaths } from '@/lib/markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface DocPageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

// Generate static params at build time
export async function generateStaticParams() {
  return getAllDocumentPaths('docs');
}

// Enable static generation
export const dynamic = 'force-static';

export default async function DocPage({ params }: DocPageProps) {
  const { category, slug } = await params;
  
  const doc = getMarkdownDocument(`docs/${category}`, slug);
  
  if (!doc) {
    notFound();
  }

  // Get all documents in this category to determine navigation
  const allDocs = getAllMarkdownDocuments(`docs/${category}`);
  const currentIndex = allDocs.findIndex(d => d.slug === slug);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <div className="mb-8">
          <Link 
            href="/docs" 
            className="inline-flex items-center text-[#f23b36] hover:text-[#d32f2f] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documentation
          </Link>
        </div>

        {/* Article Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{doc.title}</h1>
          <div className="flex items-center text-sm text-gray-600">
            <span>Documentation</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{category.replace('-', ' ')}</span>
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
            {doc.content}
          </ReactMarkdown>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-4">
          {prevDoc ? (
            <Link 
              href={`/docs/${category}/${prevDoc.slug}`}
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
              href={`/docs/${category}/${nextDoc.slug}`}
              className="inline-flex items-center px-6 py-3 bg-[#f23b36] text-white rounded-lg hover:bg-[#d32f2f] transition-colors text-sm font-medium ml-auto"
            >
              <span className="truncate">{nextDoc.title}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-gradient-to-r from-[#f23b36] to-[#d32f2f] rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
          <p className="text-lg mb-6 opacity-90">
            Check out our other resources or contact our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/support"
              className="px-6 py-3 bg-white text-[#f23b36] rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              Support Center
            </Link>
            <Link 
              href="/contact"
              className="px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}