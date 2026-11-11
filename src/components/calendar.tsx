"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
export type CalendarEvent = {
  date: string;
  title: string;
  id: string;
  type: string;
};
export function CreativeCalendar({ events }: { events: CalendarEvent[] }) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selected, setSelected] = useState("");
  const year = month.getFullYear(),
    index = month.getMonth();
  const offset = new Date(year, index, 1).getDay(),
    days = new Date(year, index + 1, 0).getDate();
  const prefix = `${year}-${String(index + 1).padStart(2, "0")}`;
  const agenda = events
    .filter((e) => !selected || e.date === selected)
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <section className="calendar-view">
      <div className="row between">
        <h2>
          {month.toLocaleDateString("en", { month: "long", year: "numeric" })}
        </h2>
        <div className="row">
          <button
            className="icon-button"
            aria-label="Previous month"
            onClick={() => {
              setMonth(new Date(year, index - 1, 1));
              setSelected("");
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Next month"
            onClick={() => {
              setMonth(new Date(year, index + 1, 1));
              setSelected("");
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <span className="calendar-weekday" key={d}>
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={"blank" + i} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = `${prefix}-${String(i + 1).padStart(2, "0")}`;
          const items = events.filter((e) => e.date === date);
          return (
            <button
              className={`calendar-day ${selected === date ? "selected-date" : ""}`}
              aria-label={`${date}${items.length ? `, ${items.length} deadline(s)` : ""}`}
              key={date}
              onClick={() => setSelected(selected === date ? "" : date)}
            >
              <span>{i + 1}</span>
              {items.slice(0, 2).map((e) => (
                <small key={e.id} title={e.title}>
                  {e.title}
                </small>
              ))}
              {items.length > 2 && <small>+{items.length - 2} more</small>}
            </button>
          );
        })}
      </div>
      <div className="section-title">
        <h3>{selected || "Upcoming deadlines"}</h3>
        {selected && (
          <button className="text-button" onClick={() => setSelected("")}>
            Show all
          </button>
        )}
      </div>
      {agenda.map((e) => (
        <div className="calendar-event" key={e.id}>
          <time dateTime={e.date}>{e.date}</time>
          <span className="tag">{e.type}</span>
          <strong>{e.title}</strong>
        </div>
      ))}
      {!agenda.length && (
        <p>
          {selected
            ? "No deadlines on this day."
            : "Add a project deadline or task due date to see it here."}
        </p>
      )}
    </section>
  );
}
