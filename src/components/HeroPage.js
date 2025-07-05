import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaTimes,
  FaSmile,
  FaSadTear,
  FaAngry,
  FaBed,
  FaBatteryFull,
} from "react-icons/fa";
import {
  FaBullseye,
  FaCalendarCheck,
  FaRobot,
  FaChartLine,
  FaUsers,
} from "react-icons/fa";
import {
  FaListAlt,
  FaBook,
  FaClock,
  FaCalendarAlt,
  FaPaintBrush,
  FaImage,
  FaMobileAlt,
  FaThLarge,
  FaAdjust,
  FaUtensils,
  FaShoppingCart,
  FaDice,
  FaRocket,
  FaGamepad
} from "react-icons/fa";
import { motion, useAnimation, useInView } from "framer-motion";
import karthikHero from "../assets/karthik_hero.png";
import { useTypewriter } from "../hooks/useTypewriter";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import {useIsTouchDevice} from "../hooks/useIsTouchDevice";

const CustomCursor = () => {
  const [pos, setPos] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const raf = useRef();

  useEffect(() => {
    // Hide cursor on mobile
    const checkMobile = () => setVisible(window.innerWidth > 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const move = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", move);

    const animate = () => {
      setPos((prev) => {
        // Use a higher lerp factor for more seamless, snappy following
        const lerp = 0.35;
        return {
          x: prev.x + (mouse.current.x - prev.x) * lerp,
          y: prev.y + (mouse.current.y - prev.y) * lerp,
        };
      });
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("resize", checkMobile);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  useEffect(() => {
    const onEnter = () => setHovered(true);
    const onLeave = () => setHovered(false);
    document
      .querySelectorAll("button, a, input, textarea, .cursor-pointer")
      .forEach((el) => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    return () => {
      document
        .querySelectorAll("button, a, input, textarea, .cursor-pointer")
        .forEach((el) => {
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
        });
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: hovered ? 40:25,
        height: hovered ? 40:25,
        borderRadius: "50%",
        background: "#fff",
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        mixBlendMode: "difference",
        boxShadow: hovered ? "0 0 24px 8px #ffe06688" : "0 0 8px 2px #1a9a9d44",
        transition: "width 0.18s, height 0.18s, box-shadow 0.18s",
        willChange: "transform",
      }}
    />
  );
};

const features = [
  {
    title: "Goal Tracker",
    desc: "Add goals and subgoals with deadlines. Watch your progress grow with dynamic progress bars as you complete each task.",
    icon: (
      <FaBullseye className="text-4xl text-yellow-400 mb-2 drop-shadow-lg" />
    ),
    video: "/videos/goals.mp4",
    color: "from-yellow-100 to-yellow-300",
    border: "border-yellow-300",
    shadow: "shadow-yellow-200",
  },
  {
    title: "To-Do List",
    desc: "Plan your daily tasks with a beautiful pie chart visualization to track completion at a glance.",
    icon: (
      <FaListAlt className="text-4xl text-orange-400 mb-2 drop-shadow-lg" />
    ),
    video: "/videos/todos.mp4",
    color: "from-orange-100 to-orange-300",
    border: "border-orange-300",
    shadow: "shadow-orange-200",
  },
  {
    title: "Habit Tracker",
    desc: "Track habits, maintain streaks, and monitor your consistency with smart visuals and completion stats.",
    icon: (
      <FaCalendarCheck className="text-4xl text-green-400 mb-2 drop-shadow-lg" />
    ),
    video: "/videos/habits.mp4",
    color: "from-green-100 to-green-300",
    border: "border-green-300",
    shadow: "shadow-green-200",
  },
  {
    title: "Journals",
    desc: "Write and reflect with daily journal entries. Easily browse your previous notes and thoughts.",
    icon: <FaBook className="text-4xl text-pink-400 mb-2 drop-shadow-lg" />,
    video: "/videos/journals.mp4",
    color: "from-pink-100 to-pink-300",
    border: "border-pink-300",
    shadow: "shadow-pink-200",
  },
  {
    title: "Pomodoro Timer",
    desc: "Boost focus using customizable Pomodoro sessions with automatic tracking and timeline integration.",
    icon: <FaClock className="text-4xl text-red-400 mb-2 drop-shadow-lg" />,
    video: "/videos/pomodoro.mp4",
    color: "from-red-100 to-red-300",
    border: "border-red-300",
    shadow: "shadow-red-200",
  },
  {
    title: "Calendar Integration",
    desc: "Automatically sync your goals and schedules to an intuitive calendar view.",
    icon: (
      <FaCalendarAlt className="text-4xl text-blue-400 mb-2 drop-shadow-lg" />
    ),
    video: "/videos/calendar.mp4",
    color: "from-blue-100 to-blue-300",
    border: "border-blue-300",
    shadow: "shadow-blue-200",
  },
  {
    title: "AI Voice Assistant",
    desc: "Use voice commands to manage your to-dos — add, delete, or mark them done using natural speech.",
    icon: <FaRobot className="text-4xl text-cyan-400 mb-2 drop-shadow-lg" />,
    video: "/videos/aivoice.mp4",
    color: "from-cyan-100 to-cyan-300",
    border: "border-cyan-300",
    shadow: "shadow-cyan-200",
  },
  {
    title: "AI Insights & Analysis",
    desc: "Let AI analyze your habits and journals to give you smart insights, summaries, and personal growth suggestions.",
    icon: (
      <FaChartLine className="text-4xl text-indigo-400 mb-2 drop-shadow-lg" />
    ),
    video: "/videos/aiinsights.mp4",
    color: "from-indigo-100 to-indigo-300",
    border: "border-indigo-300",
    shadow: "shadow-indigo-200",
  },
  {
    title: "Community Page",
    desc: "Post thoughts, get feedback, and engage with a supportive growth community. Like, comment, and connect.",
    icon: <FaUsers className="text-4xl text-purple-400 mb-2 drop-shadow-lg" />,
    video: "/videos/community.mp4",
    color: "from-purple-100 to-purple-300",
    border: "border-purple-300",
    shadow: "shadow-purple-200",
  },
  {
    title: "Whiteboard",
    desc: "Draw, write, add shapes and images to brainstorm ideas. Save, export, and upload to your gallery.",
    icon: (
      <FaPaintBrush className="text-4xl text-rose-400 mb-2 drop-shadow-lg" />
    ),
    video: "/videos/whiteboard.mp4",
    color: "from-rose-100 to-rose-300",
    border: "border-rose-300",
    shadow: "shadow-rose-200",
  },
  {
    title: "Whiteboard Gallery",
    desc: "View, zoom, pan, and manage your saved whiteboards with naming and export tools.",
    icon: <FaImage className="text-4xl text-fuchsia-400 mb-2 drop-shadow-lg" />,
    video: "/videos/gallery.mp4",
    color: "from-fuchsia-100 to-fuchsia-300",
    border: "border-fuchsia-300",
    shadow: "shadow-fuchsia-200",
  },
  {
    title: "Dashboard View",
    desc: "Your productivity cockpit – see your goals, todos, habits, and journals at a glance in one unified place.",
    icon: <FaThLarge className="text-4xl text-gray-500 mb-2 drop-shadow-lg" />,
    video: "/videos/dashboard.mp4",
    color: "from-gray-100 to-gray-300",
    border: "border-gray-300",
    shadow: "shadow-gray-200",
  },
  {
    title: "Motivation + Toolbar",
    desc: "Stay inspired with personalized motivation and access key tools via a convenient toolbar.",
    icon: <FaRocket className="text-4xl text-amber-400 mb-2 drop-shadow-lg" />,
    video: "/videos/motivation.mp4",
    color: "from-amber-100 to-amber-300",
    border: "border-amber-300",
    shadow: "shadow-amber-200",
  },
  {
    title: "Gamification",
    desc: "Earn XP, level up, and celebrate progress with animations and feedback — growth made fun.",
    icon: <FaGamepad className="text-4xl text-teal-400 mb-2 drop-shadow-lg" />,
    video: "/videos/game.mp4",
    color: "from-teal-100 to-teal-300",
    border: "border-teal-300",
    shadow: "shadow-teal-200",
  },
  {
    title: "Roulette Decision Spinner",
    desc: "Feeling stuck? Spin the wheel to randomly pick a task, goal, or habit to work on.",
    icon: <FaDice className="text-4xl text-lime-400 mb-2 drop-shadow-lg" />,
    video: "/videos/roulette.mp4",
    color: "from-lime-100 to-lime-300",
    border: "border-lime-300",
    shadow: "shadow-lime-200",
  },
  {
    title: "Recipes Cookbook",
    desc: "Save and share your favorite recipes. AI checks if you have all ingredients from your grocery list.",
    icon: <FaUtensils className="text-4xl text-red-300 mb-2 drop-shadow-lg" />,
    video: "/videos/recipes.mp4",
    color: "from-red-100 to-red-300",
    border: "border-red-300",
    shadow: "shadow-red-200",
  },
  {
    title: "Smart Grocery List",
    desc: "Add groceries manually or extract from recipes using AI. Batch mark, share, or copy lists instantly.",
    icon: (
      <FaShoppingCart className="text-4xl text-emerald-400 mb-2 drop-shadow-lg" />
    ),
    video: "/videos/grocery.mp4",
    color: "from-emerald-100 to-emerald-300",
    border: "border-emerald-300",
    shadow: "shadow-emerald-200",
  },
  {
    title: "Light & Dark Mode",
    desc: "Switch effortlessly between light and dark themes to match your mood or time of day.",
    icon: (
      <FaAdjust className="text-4xl text-neutral-400 mb-2 drop-shadow-lg" />
    ),
    video: "/videos/dark.mp4",
    color: "from-neutral-100 to-neutral-300",
    border: "border-neutral-300",
    shadow: "shadow-neutral-200",
  },
  {
    title: "Offline Persistence",
    desc: "Use Life Mastery on any device with full sync and offline capability — productivity without limits.",
    icon: (
      <FaMobileAlt className="text-4xl text-zinc-400 mb-2 drop-shadow-lg" />
    ),
    video: "/videos/offline.mp4",
    color: "from-zinc-100 to-zinc-300",
    border: "border-zinc-300",
    shadow: "shadow-zinc-200",
  },
  {
    title: "Responsive on All Devices",
    desc: "Enjoy a seamless experience whether you're using a phone, tablet, or desktop. Life Mastery adapts perfectly to any screen size.",
    icon: <FaMobileAlt className="text-4xl text-sky-400 mb-2 drop-shadow-lg" />,
    video: "/videos/gresponsive.mp4",
    color: "from-sky-100 to-sky-300",
    border: "border-sky-300",
    shadow: "shadow-sky-200",
  },
];

const FeatureCard = ({ feature, idx, cardVariants, isInView, isTouchDevice }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <motion.div
      key={feature.title}
      custom={idx}
      variants={cardVariants}
      whileHover={{
        scale: 1.08,
        rotate: [0, 2, -2, 0],
        boxShadow: `0 8px 32px 0 #ffe06655, 0 0 0 4px #1a9a9d22`,
        borderColor: "#ffe066",
        transition: { duration: 0.4 },
      }}
      whileTap={{ scale: 0.97, rotate: -2 }}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={`relative bg-gradient-to-br ${feature.color} rounded-3xl shadow-xl p-8 flex flex-col items-center border-2 ${feature.border} group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl ${feature.shadow}`}
      style={{
        background: `linear-gradient(135deg,rgba(255,255,255,0.95) 60%,rgba(255,255,255,0.7) 100%)`,
        willChange: "transform",
      }}
      onMouseMove={(e) => {
        // Micro-interaction: light follows mouse
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      }}
    >
      {/* Animated Glow Follows Mouse */}
      <span
        className="pointer-events-none absolute left-0 top-0 w-full h-full rounded-3xl"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x,50%) var(--mouse-y,50%), #ffe06633 0%, transparent 80%)`,
          opacity: 0.7,
          zIndex: 1,
          transition: "background 0.2s",
        }}
      />
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={isInView ? { scale: 1, opacity: 1, y: 0 } : {}}
        transition={{
          duration: 0.5,
          delay: 0.2 + idx * 0.13,
          type: "spring",
        }}
        className="mb-2 z-10"
      >
        {feature.icon}
      </motion.div>
      {/* Title */}
      <motion.h4
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.3 + idx * 0.13 }}
        className="text-2xl font-bold text-blue-700 mb-2 z-10 text-center"
      >
        {feature.title}
      </motion.h4>
      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.4 + idx * 0.13 }}
        className="text-blue-900 text-center z-10 font-medium"
      >
        {feature.desc}
      </motion.p>
      {/* Animated underline on hover */}
      <motion.div
        className="h-1 w-12 rounded-full bg-gradient-to-r from-yellow-400 to-blue-400 mt-4 opacity-70"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1.1 }}
        transition={{ type: "spring", stiffness: 300 }}
        style={{ originX: 0 }}
      />
      <motion.div
        className="relative w-full flex justify-center items-center my-2"
        style={{ minHeight: 120 }}
      >
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-[100] bg-white/70 rounded-xl pointer-events-none select-none text-blue-900 font-semibold text-center text-base sm:text-lg">
            {isTouchDevice
              ? "Touch to watch the feature in action"
              : "Hover to watch the feature in action"}
          </div>
        )}
        <motion.video
          src={feature.video}
          alt={feature.title}
          preload="none"
          loading="lazy"
          autoPlay={false}
          loop
          playsInline
          className="rounded-xl shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-40 sm:h-48 md:h-56 lg:h-64 object-cover border border-blue-100"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 0.7, scale: 1 }}
          whileHover={{ opacity: 1, scale: 1.03 }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onMouseOver={async (e) => {
            try {
              await e.currentTarget.play();
            } catch (err) {
              // Ignore play interruption errors
            }
          }}
          onMouseOut={(e) => {
            try {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            } catch (err) {
              // Ignore pause interruption errors
            }
          }}
          onTouchStart={async (e) => {
            try {
              await e.currentTarget.play();
            } catch (err) {}
          }}
          onTouchEnd={(e) => {
            try {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            } catch (err) {}
          }}
          style={{ transition: "opacity 0.3s, transform 0.3s" }}
        />
      </motion.div>
    </motion.div>
  );
}

const Hero = () => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(
    "bg-gradient-to-br from-indigo-500 to-blue-600"
  );
  const isLoggedIn = false;

  // Mouse movement for hero image
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const heroImgRef = useRef(null);

  const isTouchDevice = useIsTouchDevice();

  

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!heroImgRef.current) return;
      const rect = heroImgRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 30;
      setImgPos({ x, y });
    };
    const node = heroImgRef.current;
    if (node) {
      node.addEventListener("mousemove", handleMouseMove);
      node.addEventListener("mouseleave", () => setImgPos({ x: 0, y: 0 }));
    }
    return () => {
      if (node) {
        node.removeEventListener("mousemove", handleMouseMove);
        node.removeEventListener("mouseleave", () => setImgPos({ x: 0, y: 0 }));
      }
    };
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };

  const handleMoodChange = (mood) => {
    switch (mood) {
      case "happy":
        setBackgroundColor("bg-gradient-to-br from-yellow-400 to-orange-500");
        break;
      case "stressed":
        setBackgroundColor("bg-gradient-to-br from-red-400 to-orange-600");
        setShowPopup(true);
        break;
      case "angry":
        setBackgroundColor("bg-gradient-to-br from-red-500 to-pink-500");
        setShowPopup(true);
        break;
      case "upset":
        setBackgroundColor("bg-gradient-to-br from-gray-400 to-gray-600");
        setShowPopup(true);
        break;
      case "energized":
        setBackgroundColor("bg-gradient-to-br from-green-400 to-teal-500");
        break;
      case "relaxed":
        setBackgroundColor("bg-gradient-to-br from-blue-300 to-purple-500");
        break;
      default:
        setBackgroundColor("bg-gradient-to-br from-indigo-500 to-blue-600");
        break;
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    stopSpeaking();
  };

  // Voice popup logic
  const startSpeaking = () => {
    const utterances = [
      `Inhale deeply for 4 seconds. Hold your breath for 4 seconds. Exhale slowly for 4 seconds.
      Remember, this is just a temporary feeling, and you're doing great!`,
    ];
    let index = 0;
    const speakNext = () => {
      if (index < utterances.length) {
        const utterance = new window.SpeechSynthesisUtterance(
          utterances[index]
        );
        utterance.voice = window.speechSynthesis
          .getVoices()
          .find((voice) => voice.name.includes("Google UK English Male"));
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onend = () => {
          index++;
          if (index < utterances.length) {
            setTimeout(speakNext, 300);
          }
        };
        window.speechSynthesis.speak(utterance);
      }
    };
    speakNext();
  };
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
  };
  useEffect(() => {
    if (showPopup) {
      startSpeaking();
    } else {
      stopSpeaking();
    }
  }, [showPopup]);

  // Typewriter logic
  const [phase, setPhase] = useState("first");
  const firstLine = useTypewriter(
    phase === "first",
    "Unlock Your True Potential with",
    70,
    () => setPhase("second")
  );
  const secondLine = useTypewriter(
    phase === "second",
    "Life Mastery!",
    70,
    () => setPhase("done")
  );

  // Scroll to learn more section
  const scrollToLearnMore = () => {
    const navHeight = 80; // Adjust if your NavBar is taller
    const section = document.getElementById("learn-more-section");
    if (section) {
      const y =
        section.getBoundingClientRect().top + window.scrollY - navHeight + 20;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);
  const particlesLoaded = useCallback(async () => {}, []);

  

  // Animation for learn more section
  const learnMoreRef = useRef(null);
  const isInView = useInView(learnMoreRef, { once: true, amount: 0.05 });
  const controls = useAnimation();
  useEffect(() => {
    console.log("isInView:", isInView);
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  // Animation variants for Learn More section
  const sectionVariants = {
    hidden: { opacity: 0, y: 100, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.9, ease: "easeOut", staggerChildren: 0.18 },
    },
  };
  const headingVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };
  const paraVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: "easeOut", delay: 0.15 },
    },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 80, scale: 0.85, rotate: -8 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.7,
        delay: 0.3 + i * 0.18,
        type: "spring",
        stiffness: 120,
      },
    }),
    hover: {
      scale: 1.07,
      boxShadow: "0 8px 32px #ffe06655",
      borderColor: "#ffe066",
      rotate: 2,
      transition: { duration: 0.25 },
    },
    tap: {
      scale: 0.97,
      rotate: -2,
      transition: { duration: 0.15 },
    },
  };


  return (
    <div
      className={`relative min-h-screen flex flex-col items-center justify-center ${backgroundColor} overflow-x-hidden sm:pt-44 `}
    >
      <CustomCursor />
      {/* Hero Section Container */}
      <div className="container mx-auto md:flex justify-center flex-col-reverse md:flex-row items-center px-6  md:py-16 md:space-y-0 md:space-x-16">
        {/* Hero Image */}
        <div
          ref={heroImgRef}
          className="flex-shrink-0 flex justify-center items-center w-full md:w-1/2 xl:w-1/3 animate-float "
          style={{ perspective: 1200 }}
        >
          <motion.img
            src={karthikHero}
            alt="Karthik Lifemastery"
            className="w-2/3 max-w-xs sm:w-full sm:max-w-none h-auto "
            initial={{
              opacity: 0,
              scale: 0.7,
              y: 60,
              filter: "blur(8px)",
              boxShadow: "0 0 0px 0px rgba(0,0,0,0)",
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              filter: "blur(0px)",
              transition: {
                type: "spring",
                stiffness: 80,
                damping: 18,
                delay: 0.2,
              },
            }}
            style={{
              rotateY: imgPos.x,
              rotateX: -imgPos.y,
              transition: "transform 0.25s cubic-bezier(.23,1.01,.32,1)",
            }}
          />
        </div>
        <div className="z-20 text-white text-center md:text-left md:space-y-8 space-y-6">
          <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight break-words max-w-3xl">
            <span>
              {phase === "first" ? (
                <>
                  {firstLine}
                  <span className="animate-blink">|</span>
                </>
              ) : (
                <>Unlock Your True Potential with</>
              )}
            </span>
            <br />
            <span className="text-yellow-300">
              {phase === "second" && (
                <>
                  {secondLine}
                  <span className="animate-blink">|</span>
                </>
              )}
              {phase === "done" && (
                <>
                  Life Mastery!<span className="animate-blink">|</span>
                </>
              )}
            </span>
          </h2>
          <p className="text-lg sm:text-2xl opacity-90 max-w-lg mx-auto md:mx-0 tracking-wide leading-relaxed">
            Organize your life, track your habits, set goals, and achieve
            personal growth with our intelligent tools. Begin your journey
            today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center md:justify-start">
            <button
              onClick={handleGetStarted}
              className="px-12 py-5 text-xl sm:px-8 sm:py-3 sm:text-base bg-yellow-400 text-blue-600 font-semibold rounded-full hover:bg-yellow-500 hover:text-white transition duration-300 flex items-center justify-center space-x-2 mx-auto md:mx-0 z-40"
            >
              <span>Get Started</span>
              <FaArrowRight />
            </button>
            <button
              onClick={scrollToLearnMore}
              className="px-8 py-3 text-lg bg-white bg-opacity-20 text-white border border-white rounded-full hover:bg-opacity-40 transition duration-300"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Mood Selector */}
      <div className="w-full flex-wrap justify-center items-center space-x-4 md:mt-0 z-10 sm:space-x-8 sm:space-y-0 space-y-4 sm:mt-24 flex mb-12">
        <p className="text-white text-xl">How are you feeling today?</p>
        <div className="flex flex-wrap justify-center space-x-4 mt-4">
          <button
            onClick={() => handleMoodChange("happy")}
            className="px-4 py-2 bg-yellow-400 text-white rounded-full hover:bg-yellow-500 transition flex items-center space-x-2"
          >
            <FaSmile />
            <span>Happy</span>
          </button>
          <button
            onClick={() => handleMoodChange("stressed")}
            className="px-4 py-2 bg-red-400 text-white rounded-full hover:bg-red-500 transition flex items-center space-x-2"
          >
            <FaSadTear />
            <span>Stressed</span>
          </button>
          <button
            onClick={() => handleMoodChange("angry")}
            className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition flex items-center space-x-2"
          >
            <FaAngry />
            <span>Angry</span>
          </button>
          <button
            onClick={() => handleMoodChange("upset")}
            className="px-4 py-2 bg-gray-400 text-white rounded-full hover:bg-gray-500 transition flex items-center space-x-2"
          >
            <FaSadTear />
            <span>Upset</span>
          </button>
          <button
            onClick={() => handleMoodChange("energized")}
            className="px-4 py-2 bg-green-400 text-white rounded-full hover:bg-green-500 transition flex items-center space-x-2"
          >
            <FaBatteryFull />
            <span>Energized</span>
          </button>
          <button
            onClick={() => handleMoodChange("relaxed")}
            className="px-4 py-2 bg-blue-300 text-white rounded-full hover:bg-blue-400 transition flex items-center space-x-2"
          >
            <FaBed />
            <span>Relaxed</span>
          </button>
        </div>
      </div>

      {/* Pop-Up Widget */}
      {showPopup && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative">
            <FaTimes
              onClick={closePopup}
              className="absolute top-2 right-2 text-xl cursor-pointer text-gray-600"
            />
            <h3 className="text-xl font-bold mb-4">Take a Deep Breath</h3>
            <p className="mb-4">
              Let's take a moment to calm down. Here are some breathing
              exercises:
            </p>
            <ol className="list-decimal pl-4 mb-4">
              <li>Inhale deeply for 4 seconds.</li>
              <li>Hold your breath for 4 seconds.</li>
              <li>Exhale slowly for 4 seconds.</li>
            </ol>
            <p className="italic text-gray-600">
              Remember, this is just a temporary feeling, and you're doing
              great!
            </p>
          </div>
        </div>
      )}

      {/* Decorative Bubbles */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-0">
        <div className="absolute top-0 left-0 opacity-20">
          <div className="w-32 h-32 bg-gradient-to-br from-yellow-500 to-blue-500 rounded-full blur-xl"></div>
        </div>
        <div className="absolute bottom-0 right-0 opacity-20">
          <div className="w-48 h-48 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-xl"></div>
        </div>
        <div className="absolute bottom-12 left-12 opacity-30">
          <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full blur-xl"></div>
        </div>
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 top-16 left-10 animate__animated animate__fadeIn animate__delay-1s z-0 hidden sm:block">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="rgba(255, 255, 255, 0.1)"
          className="animate-bounce"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
      </div>

      {/* --- Learn More Section --- */}
      <motion.section
        id="learn-more-section"
        ref={learnMoreRef}
        initial="hidden"
        animate={controls}
        variants={sectionVariants}
        className="relative z-10 w-full bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-24 px-4 flex flex-col items-center mt-24 overflow-hidden"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          willChange: "transform",
        }}
      >
        {/* Particle.js background for Learn More */}
        <Particles
          id="learn-more-particles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={{
            fullScreen: { enable: false },
            background: { color: { value: "transparent" } },
            fpsLimit: 60,
            particles: {
              color: { value: "#1a9a9d" },
              links: {
                enable: true,
                color: "#ffe066",
                distance: 120,
                opacity: 0.18,
              },
              move: { enable: true, speed: 0.5, outModes: "bounce" },
              number: { value: 18, density: { enable: true, area: 800 } },
              opacity: { value: 0.13 },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 7 } },
            },
            detectRetina: true,
          }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
          }}
        />

        {/* Animated Heading */}
        <motion.h3
          variants={headingVariants}
          className="text-5xl sm:text-6xl font-extrabold  bg-clip-text text-blue-700 mb-6 relative z-10 tracking-tight drop-shadow-lg"
          whileHover={{ scale: 1.03, textShadow: "0 2px 24px #ffe06688" }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <span className="inline-block animate-gradient-x">
            Learn More About Life Mastery
          </span>
        </motion.h3>

        {/* Animated Paragraph */}
        <motion.p
          variants={paraVariants}
          className="max-w-2xl text-xl sm:text-2xl text-blue-900 text-center mb-16 relative z-10 font-medium"
          whileHover={{ scale: 1.02, color: "#1a9a9d" }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          Life Mastery is your all-in-one platform for personal growth. Organize
          your life, track habits, set goals, and join a supportive community.
          Our intelligent tools help you stay motivated and achieve your dreams.
        </motion.p>

        {/* Animated Feature Cards Grid */}
        <div className="relative w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 z-[100000]">
          {features.map((feature, idx) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              idx={idx}
              cardVariants={cardVariants}
              isInView={isInView}
              isTouchDevice={isTouchDevice}
            />
          ))}
        </div>

        {/* Decorative SVG Blobs */}
        <motion.svg
          className="absolute -bottom-24 -left-24 w-96 h-96 z-0"
          viewBox="0 0 400 400"
          fill="none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.18, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          style={{ filter: "blur(24px)" }}
        >
          <ellipse cx="200" cy="200" rx="200" ry="120" fill="#ffe066" />
        </motion.svg>
        <motion.svg
          className="absolute -top-24 right-0 w-96 h-96 z-0"
          viewBox="0 0 400 400"
          fill="none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.13, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.7 }}
          style={{ filter: "blur(24px)" }}
        >
          <ellipse cx="200" cy="200" rx="200" ry="120" fill="#1a9a9d" />
        </motion.svg>
        <button
          onClick={handleGetStarted}
          className="px-24 py-10 mt-14 text-2xl sm:px-8 sm:py-3 sm:text-lg bg-yellow-400 text-blue-600 font-semibold rounded-full hover:bg-yellow-500 hover:text-white transition duration-300 flex items-center justify-center space-x-2 mx-auto md:mx-0 z-40"
        >
          <span>Get Started</span>
          <FaArrowRight />
        </button>
      </motion.section>
    </div>
  );
};

export default Hero;
