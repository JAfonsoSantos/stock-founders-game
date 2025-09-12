import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date?: Date;
  onDateSelect: (date: Date) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ date, onDateSelect, placeholder = "Pick a date", className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(date || new Date());

  const today = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  // Create calendar days
  const days = [];
  
  // Previous month empty cells
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  const handleDateSelect = (selectedDate: Date) => {
    onDateSelect(selectedDate);
    setIsOpen(false);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isToday = (checkDate: Date) => {
    return checkDate.toDateString() === today.toDateString();
  };

  const isSelected = (checkDate: Date) => {
    return date && checkDate.toDateString() === date.toDateString();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-12 justify-start text-left font-normal bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
            !date && "text-gray-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={previousMonth}
              className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </div>
            <button
              onClick={nextMonth}
              className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="h-9 w-9 text-center text-sm font-normal text-gray-500 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div key={index} className="h-9 w-9 text-center text-sm p-0 relative">
                {day && (
                  <button
                    onClick={() => handleDateSelect(day)}
                    className={cn(
                      "h-9 w-9 p-0 font-normal text-center rounded hover:bg-gray-100 w-full",
                      isToday(day) && "bg-white border border-orange-500 text-gray-900",
                      isSelected(day) && "bg-orange-500 text-white border border-orange-500 hover:bg-orange-600"
                    )}
                  >
                    {day.getDate()}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}