import React, { useState } from "react";
import image1 from "../assets/port1.png"
import image2 from "../assets/port2.png"
import image3 from "../assets/port3.png"
import image4 from "../assets/port4.png"
import profile from "../assets/port5.jpeg"
import { FaFacebook, FaWhatsapp, FaPhoneAlt, FaEnvelope, FaInstagram, FaYoutube } from "react-icons/fa";
// Portfolio.jsx (dynamic)
// - This version uses arrays to drive the UI so you can add/remove items easily.
// - Update the arrays below (NAV_LINKS, HERO_SKILLS, SIDEBAR_SKILLS, PROJECTS, SOCIAL)
//   to make the page dynamic without touching markup.

export default function Portfolio() {
  // --- Data arrays (edit these to change the site content) ---
  const NAV_LINKS = [
    { href: "#about", label: "About" },
    { href: "#projects", label: "Projects" },
    { href: "#contact", label: "Contact" },
  ];

  const HERO_SKILLS = [
    "React",
    "JavaScript",
    "HTML/CSS",
    "Node.js",
    "MongoDB",
    "Responsive UI",
    "Python"
  ];

  const SIDEBAR_SKILLS = [
    "React",
    "JavaScript",
    "Node.js",
    "Express",
    "MongoDB",
    "CSS",
  ];

const PROJECTS = [
  {
    id: "lbr-cleaning",
    title: "LBR Cleaning Website",
    description:
      "A professional cleaning service site with engaging content and clear presentation of each service offered.",
    tech: ["React", "CSS", "JavaScript"],
    image:
      image2,
    demo: "https://lbr-cleaning.vercel.app/",
    code: "https://github.com/sundaydavid383/lbr-cleaning",
  },
  {
    id: "newsprings-church",
    title: "RCCG Newsprings Church Website",
    description:
      "An official church website displaying programs, events, and ministry areas — dynamically managed and easy to update.",
    tech: ["React", "Express", "MongoDB"],
    image:
      image2,
    demo: "https://newsprings-raqf.vercel.app/",
    code: "https://github.com/sundaydavid383/newsprings-church",
  },
  {
    id: "youth-newsprings",
    title: "RCCG Youth Newsprings (TIM412)",
    description:
      "A youth-focused digital platform with galleries, event updates, and inspiring ministry content for young believers.",
    tech: ["React", "CSS", "Node.js"],
    image:
      image1,
    demo: "https://full-newspring-rbrg.vercel.app/",
    code: "https://github.com/sundaydavid383/youth-newsprings",
  },
  {
    id: "pingup",
    title: "Springs Connect (PingUp)",
    description:
      "A social networking platform allowing users to share posts, images, and interact in real-time — a project still in development.",
    tech: ["React", "Node.js", "Express", "MongoDB"],
    image:
      image3,
    demo: "https://pingup-alpha.vercel.app/",
    code: "https://github.com/sundaydavid383/pingup",
  },

  {
    id: "testimony-app",
    title: "Testimony Submission App",
    description:
      "React app for church members to share testimonies with form validation, media preview, and geolocation.",
    tech: ["React", "Node", "MongoDB"],
    image:
      image4,
    demo: "#",
    code: "https://github.com/sundaydavid383/testimony-app",
  },
];


const SOCIAL = [
  { name: "GitHub", href: "https://github.com/sundaydavid383" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/sunday-david383" }, // update if you have an actual link
  { name: "Twitter (X)", href: "https://x.com/sundaydavid383" }, // update if you have an actual link
  { name: "Email", href: "mailto:sundayudoh383@gmail.com" },
];

  // --- Local state for contact feedback ---
  const [contactStatus, setContactStatus] = useState(null);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = form.get("name")?.trim();
    const email = form.get("email")?.trim();
    const message = form.get("message")?.trim();

    if (!name || !email || !message) {
      setContactStatus({ type: "error", msg: "Please fill all fields." });
      return;
    }

    // Replace with real submit logic (fetch / email service)
    console.log("Contact form submitted", { name, email, message });
    setContactStatus({ type: "success", msg: "Thanks! I will get back to you soon." });
    e.target.reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* NAVBAR */}
      <nav className="bg-white/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="font-bold text-xl title">David</div>
          <div className="hidden md:flex gap-6 items-center">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-indigo-600">
                {link.label}
              </a>
            ))}

            <a
              href="#projects"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700 transition"
            >
              View Work
            </a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header id="hero" className="bg-gradient-to-br from-indigo-700 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 flex flex-col md:flex-row items-center gap-10">
          {/* Left - Intro */}
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">Hi — I’m David.</h1>
<p className="text-lg md:text-xl opacity-90 mb-6">
  Full-Stack Web Developer & Machine Learning Enthusiast passionate about building intuitive,
  high-performance apps with <strong>React</strong>, <strong>Node.js</strong>, and <strong>MongoDB</strong>.
  I love turning ideas into elegant, functional interfaces powered by clean, intelligent code.
</p>

            <div className="flex flex-wrap gap-3 items-center">
              <a
                href="#projects"
                className="inline-block px-5 py-3 bg-white text-indigo-700 rounded-lg font-semibold shadow hover:scale-[1.02] transform transition"
              >
                View Projects
              </a>

              <a
                href="/resume.pdf"
                className="inline-block px-4 py-3 border border-white/30 rounded-lg hover:bg-white/10 transition"
                target="_blank"
                rel="noreferrer"
              >
                Download Resume
              </a>
            </div>

            {/* Quick skills chips (driven by HERO_SKILLS array) */}
            <div className="mt-6 flex flex-wrap gap-2">
              {HERO_SKILLS.map((s) => (
                <span key={s} className="text-sm bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Right - Image card */}
          <div className="w-full md:w-96 flex-shrink-0">
            <div className="bg-white/10 p-2 rounded-xl shadow-lg backdrop-blur-md hover:scale-105 transform transition">
              <img
                src={profile}
                alt="Profile"
                className="w-full rounded-lg object-cover h-64 md:h-72"
              />
            </div>
            <div className="mt-4 text-sm opacity-90">Based in Nigeria • Open to full-stack roles</div>
          </div>
        </div>
      </header>

      {/* ABOUT SECTION */}
{/* ABOUT SECTION */}
<section id="about" className="py-20" style={{ backgroundColor: "var(--color-1)" }}>
  <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
    {/* Left: Main Content */}
    <div>
      <h2 className="text-4xl font-extrabold mb-6" style={{ color: "var(--primary)" }}>
        About Me
      </h2>
      <p className="text-lg md:text-xl leading-relaxed mb-5" style={{ color: "var(--text-dark)" }}>
        I’m a <strong>Full-Stack Web Developer</strong> who builds fast, accessible, and user-focused
        applications using <strong>React</strong>, <strong>Node.js</strong>, and <strong>MongoDB</strong>.
        I write clean, efficient code and enjoy creating solutions that are both elegant and scalable.
      </p>
      <p className="text-lg md:text-xl leading-relaxed mb-6" style={{ color: "var(--text-dark)" }}>
        Beyond coding, I occasionally teach teens (ages 13–20) and share the Word of God — a mission that
        keeps me humble, disciplined, and purpose-driven.
      </p>

      {/* Things I enjoy building */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4" style={{ color: "var(--secondary)" }}>
          Things I enjoy building
        </h3>
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {[
            "Interactive UIs",
            "Form validation & UX",
            "Image overlays & customizers",
            "Responsive layouts",
            "Backend integration & APIs",
            "Machine learning concepts",
            "Real-time apps & social platforms",
            "Automation & tools for productivity",
          ].map((item) => (
            <li
              key={item}
              className="rounded-xl px-4 py-2 border shadow-sm text-center font-medium transition hover:shadow-md"
              style={{
                background: "var(--primary)",
                borderColor: "var(--input-border)",
                color: "var(--white)"
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* Right: Sidebar Cards */}
    <aside className="space-y-6">
      <div
        className="p-6 rounded-2xl shadow-lg border hover:shadow-2xl transition"
        style={{
          backgroundColor: "var(--bg-light)",
          borderColor: "var(--input-border)",
          color: "var(--text-main)"
        }}
      >
        <h3 className="text-xl font-semibold mb-3">Skills</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {SIDEBAR_SKILLS.map((k) => (
            <span
              key={k}
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ backgroundColor: "var(--primary)", color: "var(--white)" }}
            >
              {k}
            </span>
          ))}
        </div>
      </div>

      <div
        className="p-6 rounded-2xl shadow-lg border hover:shadow-2xl transition"
        style={{
          backgroundColor: "var(--bg-light)",
          borderColor: "var(--input-border)",
          color: "var(--text-main)"
        }}
      >
        <h3 className="text-xl font-semibold mb-2">Current Focus</h3>
        <p className="text-sm">
          Finishing a full-stack custom clothing site and improving real-time previews.
        </p>
      </div>

      <div
        className="p-6 rounded-2xl shadow-lg border hover:shadow-2xl transition"
        style={{
          backgroundColor: "var(--bg-light)",
          borderColor: "var(--input-border)",
          color: "var(--text-main)"
        }}
      >
        <h3 className="text-xl font-semibold mb-2">Mentorship & Impact</h3>
        <p className="text-sm">
          I’ve guided several teens in coding and spiritual growth, helping them build confidence
          and discover purpose through technology and faith.
        </p>
      </div>
    </aside>
  </div>
</section>


      {/* PROJECTS SECTION (dynamic mapping) */}
      <section id="projects" className="py-16 bg-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Selected Projects</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {PROJECTS.map((p) => (
              <article key={p.id} className="bg-white rounded-lg shadow hover:shadow-xl transition overflow-hidden">
                <img src={p.image} alt={p.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{p.title}</h3>
                  <p className="text-sm mt-2 text-gray-600">{p.description}</p>
                  <div className="mt-3 text-xs text-gray-500">{p.tech.join(" • ")}</div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-3">
                      <a href={p.demo} className="text-indigo-600 text-sm font-semibold">Demo</a>
                      <a href={p.code} className="text-indigo-600 text-sm font-semibold">Code</a>
                    </div>
                    <a href={`#${p.id}`} className="text-sm text-gray-400">Details →</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
<section id="contact" className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-6 text-indigo-700">Get in Touch</h2>
        <p className="text-gray-600 mb-10">
          You can reach me easily through any of the platforms below 👇
        </p>

        <div className="flex flex-wrap justify-center gap-6">
          {/* 📘 Facebook */}
          <a
            href="https://facebook.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white border rounded-lg px-4 py-3 shadow hover:shadow-md transition"
          >
            <FaFacebook className="text-blue-600 text-2xl" />
            <span>Facebook</span>
          </a>

          {/* 💬 WhatsApp */}
          <a
            href="https://wa.me/2349032197266" // ✅ your WhatsApp number (no '+' or leading zeros)
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white border rounded-lg px-4 py-3 shadow hover:shadow-md transition"
          >
            <FaWhatsapp className="text-green-500 text-2xl" />
            <span>WhatsApp</span>
          </a>

          {/* ☎️ Phone */}
          <a
            href="tel:+2349032197266"
            className="flex items-center gap-2 bg-white border rounded-lg px-4 py-3 shadow hover:shadow-md transition"
          >
            <FaPhoneAlt className="text-indigo-600 text-2xl" />
            <span>Call Me</span>
          </a>

          {/* 📧 Email */}
          <a
            href="mailto:sundayudoh383@gmail.com"
            className="flex items-center gap-2 bg-white border rounded-lg px-4 py-3 shadow hover:shadow-md transition"
          >
            <FaEnvelope className="text-red-500 text-2xl" />
            <span>Email</span>
          </a>

          {/* 📷 Instagram */}
          <a
            href="https://instagram.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white border rounded-lg px-4 py-3 shadow hover:shadow-md transition"
          >
            <FaInstagram className="text-pink-600 text-2xl" />
            <span>Instagram</span>
          </a>

          {/* ▶️ YouTube */}
          <a
            href="https://youtube.com/@yourchannel"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white border rounded-lg px-4 py-3 shadow hover:shadow-md transition"
          >
            <FaYoutube className="text-red-600 text-2xl" />
            <span>YouTube</span>
          </a>
        </div>

        <p className="text-gray-500 text-sm mt-10">
          I’ll be glad to connect with you anytime 😊
        </p>
      </div>
    </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="mb-3">Connect with me</div>
          <div className="flex items-center justify-center gap-4 mb-3">
            {SOCIAL.map((s) => (
              <a key={s.name} href={s.href} aria-label={s.name} className="hover:text-white">{s.name}</a>
            ))}
          </div>
          <div className="text-sm">© {new Date().getFullYear()} David. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
