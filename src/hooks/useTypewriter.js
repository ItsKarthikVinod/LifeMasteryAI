import { useState, useEffect } from "react";

export function useTypewriter(active, text, speed = 70, onDone) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!active) return;
    setDisplayed(""); // Reset when activated
  }, [active, text]);

  useEffect(() => {
    if (!active) return;
    if (displayed.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1));
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onDone && displayed.length === text.length) {
      onDone();
    }
    // eslint-disable-next-line
  }, [active, displayed, text, speed, onDone]);

  return displayed;
}
