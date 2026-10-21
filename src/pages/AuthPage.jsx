
import { useState } from "react";
import { Link } from "react-router-dom";
import "../auth.css";

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);

    const password = form.get("password");
    const confirmPassword = form.get("confirmPassword");

    if (isSignup && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    // The backend authentication API is not ready yet.
    setMessage(
      "Form validated. Authentication backend not connected yet."
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          <span className="auth-logo">↗</span>
          CryptoPulse
        </Link>

        <h1>
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>

        <p className="auth-subtitle">
          {isSignup
            ? "Join CryptoPulse and track your favourite coins."
            : "Sign in to your CryptoPulse workspace."}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <label className="auth-field">
              Full name
              <input
                name="name"
                type="text"
                placeholder="Enter your name"
                autoComplete="name"
                required
              />
            </label>
          )}

          <label className="auth-field">
            Email address
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            Password
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete={
                isSignup ? "new-password" : "current-password"
              }
              minLength={8}
              required
            />
          </label>

          {isSignup && (
            <label className="auth-field">
              Confirm password
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          )}

          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}

          <button type="submit" className="auth-submit">
            {isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup
            ? "Already have an account?"
            : "Don't have an account?"}{" "}
          <Link to={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>

        <Link to="/" className="auth-back">
          ← Back to dashboard
        </Link>
      </section>
    </main>
  );
}
