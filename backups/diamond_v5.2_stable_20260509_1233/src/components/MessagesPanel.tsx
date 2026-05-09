import { messages } from "@/lib/mockData";
import { Paperclip } from "lucide-react";

export default function MessagesPanel() {
  return (
    <div className="rounded-2xl border border-dash-border bg-dash-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Mensajes</h3>
        <button className="text-xs font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300">
          Ver Todo
        </button>
      </div>
      <div className="space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-3">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${msg.color}`}
            >
              {msg.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold text-foreground">{msg.name}</p>
                <span className="ml-2 flex-shrink-0 text-xs text-muted-foreground">
                  {msg.time}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {msg.text}
              </p>
              {msg.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.attachments.map((file, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-medium text-violet-700 dark:bg-violet-600/15 dark:text-violet-300"
                    >
                      <Paperclip className="h-3 w-3" />
                      {file}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
