import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CellWithTooltip({
  text,
  lines = 2,
}: {
  text: string;
  lines?: number;
}) {
  if (!text) return <span>-</span>;
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`min-w-0 break-words ${
              lines === 1 ? "truncate" : "line-clamp-2"
            }`}
          >
            {text}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[60ch] break-words">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
