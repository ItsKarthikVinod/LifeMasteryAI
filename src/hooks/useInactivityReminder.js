import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

const INACTIVITY_LIMIT = 60 * 1000; // 45 mins
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 mins
const NOTIFICATION_COOLDOWN =  60 * 60 * 1000; // 2 hrs

export function useInactivityReminder() {
  useEffect(() => {
    let lastActive = Date.now();

    const updateActivity = () => {
      lastActive = Date.now();
    };

    // Attach activity listeners
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActive;
      const pomodoroStatus = localStorage.getItem('pomodoroStatus'); // 'running' or 'stopped'

      if (inactiveTime > INACTIVITY_LIMIT && pomodoroStatus !== 'running') {
        const lastSent = localStorage.getItem('lastNotificationSent');

        if (!lastSent || now - parseInt(lastSent) > NOTIFICATION_COOLDOWN) {
          OneSignal.sendSelfNotification(
            "💡 Need a push?",
            "You've been inactive for a while. Spin the wheel and restart your Pomodoro!",
            "https://lifemastery.netlify.app", // Update this with your real URL
            "https://lifemastery.netlify.app/static/media/LifeMasteryLogo.b17f229477015849317b.png", // Optional icon
            {
              notification_id: "pomodoro_idle_reminder",
            }
          );

          localStorage.setItem('lastNotificationSent', now.toString());
        }
      }
    }, CHECK_INTERVAL);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(checkInterval);
    };
  }, []);
}
