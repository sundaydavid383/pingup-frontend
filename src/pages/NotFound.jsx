// src/pages/NotFound.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Compass, Sparkles } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-2"
      style={{
        background:
          "linear-gradient(135deg, var(--secondary) 0%, var(--bg-main) 40%, var(--primary-color) 140%)",
      }}
    >
      {/* Background Glow Effects */}
      <div
        className="absolute top-[-120px] left-[-100px] w-[350px] h-[350px] rounded-full blur-3xl opacity-30"
        style={{ background: "var(--primary-color)" }}
      />

      <div
        className="absolute bottom-[-120px] right-[-100px] w-[300px] h-[300px] rounded-full blur-3xl opacity-20"
        style={{ background: "var(--gold)" }}
      />

      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(var(--white) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* Main Card */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-[2rem] border p-5 md:p-8 text-center backdrop-blur-xl shadow-2xl"
        style={{
          background: "var(--deeper-opaque-secondary)",
          borderColor: "var(--glassy-white)",
          boxShadow: "0 25px 80px rgba(0,0,0,0.45)",
        }}
      >
        {/* Floating Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl border"
            style={{
              background:
                "linear-gradient(135deg, var(--primary-color), var(--hover-dark))",
              borderColor: "rgba(255,255,255,0.15)",
            }}
          >
            <Compass size={38} color="white" />
          </div>
        </div>

        {/* 404 Text */}
        <h1
          className="text-5xl md:text-6xl font-black tracking-tight mb-4"
          style={{
            color: "var(--white)",
            textShadow: "0 0 30px rgba(59,92,203,0.5)",
          }}
        >
          404
        </h1>

        {/* Heading */}
        <h2
          className="text-2xl md:text-3xl font-bold mb-4"
          style={{ color: "var(--off-white)" }}
        >
          Lost in Springs Circle?
        </h2>

        {/* Description */}
        <p
          className="text-[0.9rem] md:text-[0.94rem] leading-relaxed max-w-xl mx-auto mb-8"
          style={{ color: "var(--text-secondary)" }}
        >
          The page you are trying to access may have been moved, deleted,
          or perhaps it never existed at all. Let’s guide you back to
          somewhere meaningful.
        </p>

        {/* Decorative Line */}
        <div className="flex justify-center mb-8">
          <div
            className="h-[4px] w-32 rounded-full"
            style={{
              background:
                "linear-gradient(to right, transparent, var(--primary-color), transparent)",
            }}
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="group px-7 py-4 rounded-2xl font-semibold flex items-center gap-3 transition-all duration-300 hover:scale-105"
            style={{
              background:
                "linear-gradient(135deg, var(--primary-color), var(--hover-dark))",
              color: "var(--white)",
              boxShadow: "0 10px 30px rgba(59,92,203,0.35)",
            }}
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Return Home
          </button>

          <button
            onClick={() => navigate("/community")}
            className="px-7 py-4 rounded-2xl font-semibold border flex items-center gap-3 transition-all duration-300 hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.12)",
              color: "var(--off-white)",
            }}
          >
            <Sparkles size={18} />
            Explore Community
          </button>
        </div>

        {/* Footer */}
        <p
          className="mt-10 text-sm tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          Springs Circle • Meaningful Connections
        </p>
      </div>
    </div>
  );
}