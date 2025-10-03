import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'src/content');

export interface MarkdownDocument {
  slug: string;
  title: string;
  content: string;
  frontMatter: Record<string, any>;
}

export function getMarkdownDocument(category: string, slug: string): MarkdownDocument | null {
  try {
    const fullPath = path.join(contentDirectory, category, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data: frontMatter, content } = matter(fileContents);

    return {
      slug,
      title: frontMatter.title || slug,
      content, // Return raw markdown content
      frontMatter
    };
  } catch (error) {
    console.error(`Error reading markdown file: ${category}/${slug}.md`, error);
    return null;
  }
}

export function getAllMarkdownDocuments(category: string): MarkdownDocument[] {
  try {
    const categoryPath = path.join(contentDirectory, category);
    const files = fs.readdirSync(categoryPath);
    
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const slug = file.replace('.md', '');
        return getMarkdownDocument(category, slug);
      })
      .filter((doc): doc is MarkdownDocument => doc !== null);
  } catch (error) {
    console.error(`Error reading category: ${category}`, error);
    return [];
  }
}

export function getMarkdownCategories(): string[] {
  try {
    return fs.readdirSync(contentDirectory);
  } catch (error) {
    console.error('Error reading content directory', error);
    return [];
  }
}