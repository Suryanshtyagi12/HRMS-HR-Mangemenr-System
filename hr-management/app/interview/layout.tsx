export default function InterviewLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-900 text-white min-h-screen">
      {/* No sidebar, no navbar, completely isolated layout for interviews */}
      {children}
    </div>
  )
}
