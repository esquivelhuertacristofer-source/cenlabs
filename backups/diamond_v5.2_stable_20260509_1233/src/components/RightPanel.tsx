import LabProgressRings from "./LabProgressRings";
import CalendarPanel from "./CalendarPanel";

export default function RightPanel() {
  return (
    <aside className="space-y-5">
      <LabProgressRings />
      <CalendarPanel />
    </aside>
  );
}
