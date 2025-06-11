import { NextResponse } from 'next/server';
import { Octokit } from 'octokit';

export async function POST(request: Request) {
  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN env var not set.' },
      { status: 500 }
    );
  }
  try {
    const { repoUrl } = await request.json();
    
    // Extract owner and repo from the URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(\/|$)/i);
    
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');
    
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Fetch repository data
    const [repoData, contributors, commits] = await Promise.all([
      octokit.rest.repos.get({
        owner,
        repo,
      }),
      octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 10,
      }),
      octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 100,
      }),
    ]);

    // Process commit data for activity metrics
    const commitActivity = commits.data.map(commit => ({
      date: commit.commit.author?.date,
      message: commit.commit.message,
      author: commit.author?.login || commit.commit.author?.name,
    }));

    // Calculate commit frequency by date
    const commitFrequency: Record<string, number> = {};
    commits.data.forEach(commit => {
      if (commit.commit.author?.date) {
        const date = new Date(commit.commit.author.date).toISOString().split('T')[0];
        commitFrequency[date] = (commitFrequency[date] || 0) + 1;
      }
    });

    return NextResponse.json({
      repoData: {
        name: repoData.data.name,
        full_name: repoData.data.full_name,
        description: repoData.data.description,
        stargazers_count: repoData.data.stargazers_count,
        forks_count: repoData.data.forks_count,
        open_issues_count: repoData.data.open_issues_count,
        owner: repoData.data.owner,
      },
      contributors: contributors.data.map(contributor => ({
        login: contributor.login,
        contributions: contributor.contributions,
        avatar_url: contributor.avatar_url,
      })),
      commits: commits.data.map(commit => ({
        sha: commit.sha,
        commit: {
          author: {
            date: commit.commit.author?.date,
            name: commit.commit.author?.name,
          },
          message: commit.commit.message,
        },
        author: commit.author
          ? { login: commit.author.login, avatar_url: commit.author.avatar_url }
          : null,
      })),
    });
  } catch (error: any) {
    if (error.status === 403 && error.response?.data?.message.includes('rate limit')) {
      console.error('GitHub API Rate Limit:', error);
      return NextResponse.json(
        { error: 'GitHub API rate limit exceeded. Please try again later or set GITHUB_TOKEN.' },
        { status: 429 }
      );
    }
    console.error('GitHub API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch repository data',
        details: error.response?.data?.message || error.message 
      },
      { status: error.status || 500 }
    );
  }
}
