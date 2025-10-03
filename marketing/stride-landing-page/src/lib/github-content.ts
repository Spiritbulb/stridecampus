// lib/github-content.ts
import { Octokit } from 'octokit';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, 
});

const REPO_OWNER = 'Spiritbulb';
const REPO_NAME = 'stridecampus';
const CONTENT_PATH = 'marketing/stride-landing-page/content';

export async function getContent(path: string) {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `${CONTENT_PATH}/${path}.md`,
    });

    if ('content' in data) {
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      return content;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch content from GitHub:', error);
    return null;
  }
}

export async function getDirectory(path: string = '') {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `${CONTENT_PATH}/${path}`,
    });

    if (Array.isArray(data)) {
      return data.map(item => ({
        name: item.name.replace('.md', ''),
        path: item.path,
        type: item.type,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch directory from GitHub:', error);
    return [];
  }
}