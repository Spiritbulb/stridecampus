// lib/markdown.ts
const contentIndex = await import('./content-index.json');

export interface MarkdownDocument {
  slug: string;
  title: string;
  content: string;
  frontMatter: Record<string, any>;
}

interface ContentIndex {
  documents: Array<{
    baseCategory: string;
    category: string;
    slug: string;
    title: string;
    content: string;
    frontMatter: Record<string, any>;
  }>;
  generatedAt: string;
}

const index = contentIndex as ContentIndex;

// Helper to find documents
export function getMarkdownDocument(baseCategory: string, slug: string) {
    const document = contentIndex.documents.find(
      doc => doc.baseCategory === baseCategory && doc.slug === slug
    );
    
    if (!document) {
      console.warn(`Document not found: ${baseCategory}/${slug}`);
      return null;
    }
    
    return document;
  }
  
  export function getAllMarkdownDocuments(baseCategory: string) {
    return contentIndex.documents
      .filter(doc => doc.baseCategory === baseCategory)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  export function getAllDocumentPaths(baseCategory: string) {
    const documents = getAllMarkdownDocuments(baseCategory);
    
    return documents.map(doc => ({
      category: doc.category,
      slug: doc.slug,
    }));
  }