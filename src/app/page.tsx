"use client"
import React, { useState } from "react";

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
    console.log(weekMap)  
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

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1>GitHub Repository Insights</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={repoUrl}
          onChange={e => setRepoUrl(e.target.value)}
          placeholder="Enter GitHub repo URL (e.g. https://github.com/vercel/next.js)"
          style={{ width: 400, padding: 8, marginRight: 8 }}
          required
        />
        <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
          {loading ? "Loading..." : "Fetch Insights"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
      {repoData && (
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <h2>{repoData.full_name}</h2>
          <p>{repoData.description}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img src={repoData.owner.avatar_url} alt="Owner avatar" width={48} height={48} style={{ borderRadius: "50%" }} />
            <div>
              <strong>Owner:</strong> {repoData.owner.login}
            </div>
            <div>⭐ Stars: {repoData.stargazers_count}</div>
            <div>🍴 Forks: {repoData.forks_count}</div>
            <div>🐞 Open Issues: {repoData.open_issues_count}</div>
          </div>
        </div>
      )}
      {contributors.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3>Top Contributors</h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {contributors.map(c => (
              <div key={c.login} style={{ border: "1px solid #eee", borderRadius: 8, padding: 8, minWidth: 120, textAlign: "center" }}>
                <img src={c.avatar_url} alt={c.login} width={32} height={32} style={{ borderRadius: "50%" }} />
                <div>{c.login}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{c.contributions} commits</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {commits.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3>Recent Commits</h3>
          <ul style={{ maxHeight: 200, overflow: "auto", paddingLeft: 16 }}>
            {commits.slice(0, 10).map(c => (
              <li key={c.sha} style={{ marginBottom: 8 }}>
                <strong>{c.commit.author.name}</strong>: {c.commit.message.slice(0, 60)}
                <div style={{ fontSize: 12, color: "#555" }}>{new Date(c.commit.author.date).toLocaleString()}</div>
              </li>
            ))}
          </ul>
          <h4>Commit Frequency (per day)</h4>
          <ul>
            {Object.entries(getCommitsPerWeek(commits)).map(([date, count]) => (
              <li key={date}>{date}: {count} commits</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

