"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-background text-foreground border border-border rounded-lg shadow-sm", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-6 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-between items-center pt-2 pb-4 px-4 relative",
        caption_label: "text-sm font-semibold text-foreground",
        nav: "flex items-center gap-2",
        nav_button: cn(
          "h-8 w-8 bg-background border border-border rounded-md p-0 hover:bg-accent hover:text-accent-foreground transition-colors",
          "flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "shadow-sm hover:shadow-md hover:scale-105"
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-2",
        head_cell: "text-muted-foreground rounded-md w-10 font-medium text-xs text-center",
        row: "flex w-full mt-1 gap-1",
        cell: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(
          "h-10 w-10 p-0 font-normal rounded-md transition-colors",
          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          "aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary/90",
          "aria-selected:focus:bg-primary aria-selected:focus:text-primary-foreground"
        ),
        day_range_end: "aria-selected:rounded-r-md",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground font-semibold",
        day_outside: "day-outside text-muted-foreground/50 opacity-50 aria-selected:bg-accent/50 aria-selected:text-accent-foreground",
        day_disabled: "text-muted-foreground/50 opacity-50 cursor-not-allowed",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        PreviousMonthButton: ({ className, ...props }) => (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        ),
        NextMonthButton: ({ className, ...props }) => (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }