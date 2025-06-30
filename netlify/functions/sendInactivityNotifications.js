const fetch = require("node-fetch");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { ico } = require("@cloudinary/url-gen/qualifiers/format");

// Initialize Firebase Admin SDK (only once)
let app;
if (!global._firebaseApp) {
  app = initializeApp({ credential: applicationDefault() });
  global._firebaseApp = app;
} else {
  app = global._firebaseApp;
}
const db = getFirestore();

exports.handler = async function (event, context) {
  const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour
  const now = Date.now();

  const snapshot = await db.collection("userActivity").get();
  const notifications = [];

  for (const docSnap of snapshot.docs) {
    const { lastActive, playerId, pomodoroStatus } = docSnap.data();
    if (
      playerId &&
      pomodoroStatus !== "running" &&
      now - lastActive > INACTIVITY_LIMIT
    ) {
      notifications.push(
        fetch("https://onesignal.com/api/v1/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Basic os_v2_app_oavu4soiuvfppduzzyf2xntqnj2im5gjtgzeb4u7tkkfe6syg7cqsiivqmom4uiisqmab2bqrn3nofey7ao3l5j6jvvxteydah3klvq",
          },
          body: JSON.stringify({
            app_id: "702b4e49-c8a5-4af7-8e99-ce0babb6706a",
            include_player_ids: [playerId],
            headings: { en: "💡 Need a push?" },
            contents: {
              en: "You've been inactive for a while. Spin the wheel and restart your Pomodoro!",
            },
              url: "https://lifemastery.netlify.app",
            
          }),
        })
      );
    }
  }

  await Promise.all(notifications);

  return {
    statusCode: 200,
    body: JSON.stringify({ sent: notifications.length }),
  };
};
