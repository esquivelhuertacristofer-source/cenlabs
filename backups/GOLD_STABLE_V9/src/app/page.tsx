import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import RightPanel from "@/components/RightPanel";

export default function Home() {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr_340px]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="col-start-2 overflow-y-auto bg-dash-bg p-6">
        <MainContent />
      </main>

      {/* Right Panel */}
      <aside className="overflow-y-auto border-l border-dash-border bg-dash-bg p-5">
        <RightPanel />
      </aside>
    </div>
  );
}
