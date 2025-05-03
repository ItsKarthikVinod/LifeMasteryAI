import React, { useEffect, useRef } from "react";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";

const PomodoroTimeline = ({ sessionLog, theme, onClose }) => {
  const timelineRef = useRef(null);

  useEffect(() => {
    // Convert session logs to timeline items
    const items = sessionLog.map((session, index) => ({
      id: index,
      content: `${session.title} (${session.type})`,
      end: new Date(session.timestamp),
      start: new Date(
        new Date(session.timestamp).getTime() - session.duration * 60000
      ),
      className: "custom-timeline-item", // Add a custom class for styling
    }));

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); // Set to midnight
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // Set to the end of the day

    // Timeline options
    const options = {
      editable: false,
      stack: true,
      zoomable: true,
      orientation: "top",
      showCurrentTime: true, // Highlight the current time
      start: startOfDay, // Focus on the start of the current day
      end: endOfDay, // Focus on the end of the current day
      
      
    };

    // Initialize the timeline
    const timeline = new Timeline(timelineRef.current, items, options);

    return () => {
      timeline.destroy(); // Cleanup on component unmount
    };
  }, [sessionLog, theme]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        theme === "dark"
          ? "bg-gray-900 bg-opacity-90 text-white"
          : "bg-gray-100 bg-opacity-90 text-gray-950"
      }`}
    >
      <div
        className={`relative w-full max-w-4xl p-6 rounded-lg shadow-2xl ${
          theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        }`}
      >
        {/* Close Button */}
        <button
          className={`absolute top-1 right-4 ${
            theme === "dark" ? "bg-red-500 text-white" : "bg-red-500 text-white"
          } rounded-full p-2`}
          onClick={onClose}
        >
          ✕
        </button>

        {/* Modal Title */}
        <h3
          className={`text-2xl font-semibold mb-4 ${
            theme === "dark" ? "text-teal-400" : "text-teal-600"
          }`}
        >
          Pomodoro Timeline
        </h3>

        {/* Timeline Container */}
        <div
          ref={timelineRef}
          style={{
            height: "500px",
            width: "100%",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: theme === "dark" ? "#2d3748" : "#edf2f7",
          }}
        />
      </div>
    </div>
  );
};

export default PomodoroTimeline;
