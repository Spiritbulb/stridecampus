// scripts/generate-content-index.js
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const contentDirectory = path.join(process.cwd(), 'src/content');
const outputFile = path.join(process.cwd(), 'src/lib/content-index.json');

function getAllMarkdownFiles(dir, baseDir = dir) {
    const files = [];
    
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip dynamic route directories like [category]
        if (!item.startsWith('[') && !item.startsWith('.')) {
          files.push(...getAllMarkdownFiles(fullPath, baseDir));
        }
      } else if (item.endsWith('.md') && !item.startsWith('_')) {
        try {
          const fileContents = fs.readFileSync(fullPath, 'utf8');
          const { data: frontMatter, content } = matter(fileContents);
          
          const relativePath = path.relative(baseDir, fullPath);
          const pathParts = relativePath.split(path.sep);
          
          // Remove any index files or handle special cases
          if (pathParts.some(part => part.startsWith('[') || part.startsWith('_'))) {
            return;
          }
          
          const baseCategory = pathParts[0];
          const category = pathParts.length > 1 ? pathParts[1] : 'general';
          const slug = path.basename(item, '.md');
          
          files.push({
            baseCategory,
            category,
            slug,
            title: frontMatter.title || slug,
            description: frontMatter.description || '',
            tags: frontMatter.tags || [],
            published: frontMatter.published !== false,
            date: frontMatter.date || fs.statSync(fullPath).birthtime.toISOString(),
            url: `/${baseCategory}/${category}/${slug}`,
            filePath: relativePath,
            content: content.trim(),
            frontMatter: {
              ...frontMatter,
              priority: frontMatter.priority || 'medium'
            }
          });
          
        } catch (error) {
          console.warn(`⚠️  Could not process ${fullPath}:`, error.message);
        }
      }
    });
    
    return files;
  }

function generateIndex() {
  console.log('📚 Generating content index...');
  
  if (!fs.existsSync(contentDirectory)) {
    console.error(`❌ Content directory does not exist: ${contentDirectory}`);
    process.exit(1);
  }
  
  const allFiles = getAllMarkdownFiles(contentDirectory);
  
  // Sort by date (newest first)
  const sortedFiles = allFiles.sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  // Create organized index object
  const index = {
    documents: sortedFiles,
    categories: {
      docs: [...new Set(allFiles.filter(f => f.baseCategory === 'docs').map(f => f.category))],
      support: [...new Set(allFiles.filter(f => f.baseCategory === 'support').map(f => f.category))]
    },
    stats: {
      total: allFiles.length,
      docs: allFiles.filter(f => f.baseCategory === 'docs').length,
      support: allFiles.filter(f => f.baseCategory === 'support').length,
      published: allFiles.filter(f => f.published).length
    },
    generatedAt: new Date().toISOString()
  };
  
  // Ensure lib directory exists
  const libDir = path.dirname(outputFile);
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }
  
  // Write to file
  fs.writeFileSync(outputFile, JSON.stringify(index, null, 2));
  
  console.log(`✅ Generated content index with ${allFiles.length} documents`);
  console.log(`📊 Docs: ${index.stats.docs}, Support: ${index.stats.support}`);
  console.log(`📁 Output: ${outputFile}`);
}

// Run if called directly
if (require.main === module) {
  generateIndex();
}

module.exports = { generateIndex, getAllMarkdownFiles };