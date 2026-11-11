export function ContactListSkeleton() {
  return (
    <ul
      aria-busy="true"
      aria-label="Memuat kontak"
      className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <li key={index} className="flex flex-col gap-2 px-4 py-4">
          <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-64 max-w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </li>
      ))}
    </ul>
  )
}
