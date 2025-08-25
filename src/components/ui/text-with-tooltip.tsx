import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface TextWithTooltipProps {
  text: string;
  lines?: 1 | 2 | 3 | 4 | 5; // define explícitamente las opciones válidas
  className?: string;
}

export function TextWithTooltip({
  text,
  lines = 1,
  className = "",
}: TextWithTooltipProps) {
  const lineClampClass =
    lines === 1
      ? "line-clamp-1"
      : lines === 2
      ? "line-clamp-2"
      : lines === 3
      ? "line-clamp-3"
      : lines === 4
      ? "line-clamp-4"
      : lines === 5
      ? "line-clamp-5"
      : "";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <p className={`cursor-pointer ${lineClampClass} ${className}`}>
            {text}
          </p>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
