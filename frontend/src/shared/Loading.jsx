export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary-200 border-t-primary-600" />
        <p className="text-sm font-medium text-gray-400 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
