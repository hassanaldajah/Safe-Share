import { useEffect, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TransactionType = "SENT" | "RECEIVED";
type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

interface FileTransaction {
  id: string;
  fileId: string;
  fileName: string;
  senderTag: string;
  receiverTag: string;
  transactionType: TransactionType;
  timestamp: string; // ISO-8601
  status: TransactionStatus;
  fileSizeBytes: number | null;
}

type FilterType = "ALL" | TransactionType;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const STATUS_STYLES: Record<TransactionStatus, string> = {
  COMPLETED: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  PENDING:   "bg-amber-500/15  text-amber-400  ring-1 ring-amber-500/30",
  FAILED:    "bg-red-500/15    text-red-400    ring-1 ring-red-500/30",
  CANCELLED: "bg-slate-500/15  text-slate-400  ring-1 ring-slate-500/30",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 rounded bg-slate-700/60 w-full" />
        </td>
      ))}
    </tr>
  );
}

function EmptyState({ filter }: { filter: FilterType }) {
  return (
    <tr>
      <td colSpan={6}>
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <svg
            className="mb-4 h-12 w-12 opacity-40"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9.75h16.5m-16.5 4.5h16.5M9 3.75 3.75 9l5.25 5.25M15 3.75l5.25 5.25L15 14.25"
            />
          </svg>
          <p className="text-sm font-medium">
            No {filter !== "ALL" ? filter.toLowerCase() : ""} transactions found.
          </p>
        </div>
      </td>
    </tr>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
      <svg
        className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-red-300">Failed to load transactions</p>
        <p className="mt-0.5 text-xs text-red-400/80">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="shrink-0 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/30"
      >
        Retry
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ShareTransactionsPage() {
  const [transactions, setTransactions] = useState<FileTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");

    if (!token) {
      setError("No authentication token found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/v1/transactions", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data: FileTransaction[] = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // -------------------------------------------------------------------------
  // Derived / filtered list
  // -------------------------------------------------------------------------

  const filtered = transactions.filter((tx) => {
    const matchesFilter =
      filter === "ALL" || tx.transactionType === filter;

    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      tx.fileName.toLowerCase().includes(query) ||
      tx.senderTag.toLowerCase().includes(query) ||
      tx.receiverTag.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  // -------------------------------------------------------------------------
  // Stats derived from full data (not filtered)
  // -------------------------------------------------------------------------

  const totalSent     = transactions.filter((t) => t.transactionType === "SENT").length;
  const totalReceived = transactions.filter((t) => t.transactionType === "RECEIVED").length;
  const totalFailed   = transactions.filter((t) => t.status === "FAILED").length;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#0d1117] px-4 py-10 text-slate-100 sm:px-8">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Share Transactions
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          A complete audit log of every file you've sent and received.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats bar                                                            */}
      {/* ------------------------------------------------------------------ */}
      {!loading && !error && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total",    value: transactions.length, color: "text-sky-400" },
            { label: "Sent",     value: totalSent,           color: "text-violet-400" },
            { label: "Received", value: totalReceived,       color: "text-emerald-400" },
            { label: "Failed",   value: totalFailed,         color: "text-red-400" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-700/50 bg-slate-800/50 px-5 py-4"
            >
              <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                {label}
              </p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Error state                                                          */}
      {/* ------------------------------------------------------------------ */}
      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onRetry={fetchTransactions} />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Controls: filter tabs + search                                       */}
      {/* ------------------------------------------------------------------ */}
      {!error && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Filter tabs */}
          <div className="flex gap-1 rounded-lg border border-slate-700/50 bg-slate-800/50 p-1">
            {(["ALL", "SENT", "RECEIVED"] as FilterType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  filter === tab
                    ? "bg-sky-500 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by file, sender, receiver…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:w-72"
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Table                                                                */}
      {/* ------------------------------------------------------------------ */}
      {!error && (
        <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/60">
                  {["File", "Type", "From", "To", "Size", "Date", "Status"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-400"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-700/30">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : filtered.length === 0 ? (
                  <EmptyState filter={filter} />
                ) : (
                  filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-slate-700/20"
                    >
                      {/* File name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/60 text-slate-300">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                          <span
                            className="max-w-[180px] truncate font-medium text-slate-100"
                            title={tx.fileName}
                          >
                            {tx.fileName}
                          </span>
                        </div>
                      </td>

                      {/* Transaction type badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                            tx.transactionType === "SENT"
                              ? "bg-violet-500/15 text-violet-400 ring-violet-500/30"
                              : "bg-sky-500/15 text-sky-400 ring-sky-500/30"
                          }`}
                        >
                          {tx.transactionType === "SENT" ? (
                            <svg
                              className="h-3 w-3"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M3.105 3.105a.75.75 0 01.814-.162l13 5.5a.75.75 0 010 1.114l-13 5.5a.75.75 0 01-1.001-.96l2.036-5.097L3.105 3.105z" />
                            </svg>
                          ) : (
                            <svg
                              className="h-3 w-3"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M10 2a.75.75 0 01.75.75v12.59l1.95-2.1a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z" />
                            </svg>
                          )}
                          {tx.transactionType}
                        </span>
                      </td>

                      {/* Sender */}
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {tx.senderTag}
                      </td>

                      {/* Receiver */}
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {tx.receiverTag}
                      </td>

                      {/* File size */}
                      <td className="px-6 py-4 text-slate-400">
                        {formatFileSize(tx.fileSizeBytes)}
                      </td>

                      {/* Timestamp */}
                      <td className="whitespace-nowrap px-6 py-4 text-slate-400">
                        {formatTimestamp(tx.timestamp)}
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[tx.status]}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer row */}
          {!loading && !error && filtered.length > 0 && (
            <div className="border-t border-slate-700/50 bg-slate-800/40 px-6 py-3 text-xs text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-300">{filtered.length}</span>{" "}
              of{" "}
              <span className="font-medium text-slate-300">{transactions.length}</span>{" "}
              transactions
            </div>
          )}
        </div>
      )}
    </div>
  );
}