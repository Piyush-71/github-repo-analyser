"use client"
import React, { useState } from "react";
import { FiGithub, FiStar, FiGitBranch, FiAlertCircle, FiUsers, FiActivity, FiCalendar, FiUser } from "react-icons/fi";

interface RepoData {
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  owner: { login: string; avatar_url: string };
}

interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
}

interface Commit {
  sha: string;
  commit: { author: { date: string; name: string }; message: string };
  author: { login: string; avatar_url: string } | null;
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("https://github.com/vercel/vercel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);

  // Derived metric: commits per week
  function getCommitsPerWeek(commits: Commit[]) {
    const weekMap: Record<string, number> = {};
    commits.forEach((c) => {
      const week = c.commit.author.date.slice(0, 10); // YYYY-MM-DD
      weekMap[week] = (weekMap[week] || 0) + 1;
    });
    return weekMap;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRepoData(null);
    setContributors([]);
    setCommits([]);
    try {
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setRepoData(data.repoData);
      setContributors(data.contributors);
      setCommits(data.commits);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
              <FiGithub className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              GitHub Repository Insights
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Discover comprehensive analytics and insights for any GitHub repository
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-8 border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FiGithub className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={repoUrl}
                onChange={e => setRepoUrl(e.target.value)}
                placeholder="Enter GitHub repository URL (e.g., https://github.com/vercel/next.js)"
                className="w-full pl-12 pr-4 py-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FiActivity className="w-5 h-5" />
                  Get Insights
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8 flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Repository Overview */}
        {repoData && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-8 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex items-start gap-4 flex-1">
                <img
                  src={repoData.owner.avatar_url}
                  alt="Owner avatar"
                  className="w-16 h-16 rounded-2xl shadow-lg"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {repoData.full_name}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    {repoData.description || "No description available"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <FiUser className="w-4 h-4" />
                    <span>Owner: {repoData.owner.login}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 lg:min-w-[300px]">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 text-center border border-yellow-200 dark:border-yellow-800">
                  <FiStar className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {formatNumber(repoData.stargazers_count)}
                  </div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Stars</div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
                  <FiGitBranch className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {formatNumber(repoData.forks_count)}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Forks</div>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 text-center border border-red-200 dark:border-red-800">
                  <FiAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {formatNumber(repoData.open_issues_count)}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">Issues</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contributors */}
          {contributors.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <FiUsers className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Top Contributors</h3>
              </div>
              
              <div className="space-y-4">
                {contributors.map((contributor, index) => (
                  <div
                    key={contributor.login}
                    className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <img
                          src={contributor.avatar_url}
                          alt={contributor.login}
                          className="w-12 h-12 rounded-full shadow-md"
                        />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {contributor.login}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {contributor.contributions} contributions
                        </div>
                      </div>
                    </div>
                    <div className="w-16 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((contributor.contributions / contributors[0].contributions) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Commits */}
          {commits.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <FiActivity className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h3>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {commits.slice(0, 10).map((commit) => (
                  <div
                    key={commit.sha}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                  >
                    <div className="flex items-start gap-3">
                      {commit.author ? (
                        <img
                          src={commit.author.avatar_url}
                          alt={commit.author.login}
                          className="w-8 h-8 rounded-full shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <FiUser className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 dark:text-white font-medium mb-1 line-clamp-2">
                          {commit.commit.message.split('\n')[0]}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium">{commit.commit.author.name}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <FiCalendar className="w-3 h-3" />
                            {formatDate(commit.commit.author.date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Commit Frequency */}
        {commits.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mt-8 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                <FiCalendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Daily Commit Activity</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(getCommitsPerWeek(commits))
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .slice(0, 12)
                .map(([date, count]) => (
                  <div
                    key={date}
                    className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-800/20 rounded-xl border border-indigo-200 dark:border-indigo-800"
                  >
                    <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                      {count}
                    </div>
                    <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                      commits
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatDate(date)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}