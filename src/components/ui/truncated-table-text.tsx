"use client"

import * as React from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type TruncatedTableTextProps = {
  value: React.ReactNode
  tooltipValue?: React.ReactNode
  className?: string
  tooltipClassName?: string
  side?: React.ComponentProps<typeof TooltipContent>["side"]
  align?: React.ComponentProps<typeof TooltipContent>["align"]
}

function normalizeText(value: React.ReactNode) {
  if (value === null || value === undefined || value === "") return "-"
  return value
}

export function TruncatedTableText({
  value,
  tooltipValue,
  className,
  tooltipClassName,
  side = "top",
  align = "start",
}: TruncatedTableTextProps) {
  const displayValue = normalizeText(value)
  const fullValue = normalizeText(tooltipValue ?? value)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className={cn(
              "block min-w-0 max-w-full truncate outline-none focus-visible:ring-2 focus-visible:ring-[#397921]/35 focus-visible:ring-offset-2",
              className
            )}
          >
            {displayValue}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn("break-words", tooltipClassName)}
        >
          {fullValue}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
