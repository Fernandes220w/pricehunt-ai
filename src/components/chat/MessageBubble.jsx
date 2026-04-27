import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || 'Função';
  const status = toolCall?.status || 'pending';
  const results = toolCall?.results;

  const parsedResults = (() => {
    if (!results) return null;
    try { return typeof results === 'string' ? JSON.parse(results) : results; } catch { return results; }
  })();

  const isError = results && (
    (typeof results === 'string' && /error|failed/i.test(results)) ||
    (parsedResults?.success === false)
  );

  const statusConfig = {
    pending: { icon: Clock, color: 'text-muted-foreground', text: 'Aguardando' },
    running: { icon: Loader2, color: 'text-primary', text: 'Buscando...', spin: true },
    in_progress: { icon: Loader2, color: 'text-primary', text: 'Analisando...', spin: true },
    completed: isError
      ? { icon: AlertCircle, color: 'text-destructive', text: 'Erro' }
      : { icon: CheckCircle2, color: 'text-primary', text: 'Concluído' },
    success: { icon: CheckCircle2, color: 'text-primary', text: 'Concluído' },
    failed: { icon: AlertCircle, color: 'text-destructive', text: 'Falhou' },
    error: { icon: AlertCircle, color: 'text-destructive', text: 'Erro' }
  }[status] || { icon: Zap, color: 'text-muted-foreground', text: '' };

  const Icon = statusConfig.icon;
  const formattedName = name.replace(/\./g, ' › ').replace(/_/g, ' ');

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
          "hover:bg-secondary/50",
          expanded ? "bg-secondary border-border" : "bg-card border-border/50"
        )}
      >
        <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
        <span className="text-foreground/80 capitalize">{formattedName}</span>
        {statusConfig.text && (
          <span className={cn("text-muted-foreground", isError && "text-destructive")}>
            • {statusConfig.text}
          </span>
        )}
        {!statusConfig.spin && (toolCall.arguments_string || results) && (
          <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform ml-auto", expanded && "rotate-90")} />
        )}
      </button>
      {expanded && !statusConfig.spin && (
        <div className="mt-1.5 ml-3 pl-3 border-l-2 border-primary/20 space-y-2">
          {parsedResults && (
            <pre className="bg-secondary rounded-md p-2 text-xs text-muted-foreground whitespace-pre-wrap max-h-48 overflow-auto">
              {typeof parsedResults === 'object' ? JSON.stringify(parsedResults, null, 2) : parsedResults}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5 shrink-0">
          <Zap className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
        {message.content && (
          <div className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border rounded-bl-md"
          )}>
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  a: ({ children, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline">{children}</a>
                  ),
                  p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="px-1 py-0.5 rounded bg-secondary text-xs font-mono">{children}</code>
                    ) : (
                      <pre className="bg-secondary rounded-lg p-3 overflow-x-auto my-2">
                        <code className="text-xs font-mono">{children}</code>
                      </pre>
                    ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {message.tool_calls?.length > 0 && (
          <div className="space-y-1">
            {message.tool_calls.map((toolCall, idx) => (
              <FunctionDisplay key={idx} toolCall={toolCall} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}