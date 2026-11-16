import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Heart, KeyRound, PackageCheck, ShoppingBag, Sparkles } from "lucide-react";
import type { Auth } from "../lib/auth";
import { Button } from "./ui";
import { GoogleButton } from "./GoogleButton";
import { readAuthError } from "../lib/orvis";
import "./AuthGate.css";

const GOOGLE_LOGIN = import.meta.env.VITE_ORVIS_GOOGLE_AUTH === "1";
const AUTH_ERROR_TEXT: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  byo_credential_missing: "Google sign-in is not configured for this app yet.",
  google_not_configured: "Google sign-in is not available right now.",
};

export type AuthMode = "accounts" | "guest";

/**
 * `mode="accounts"`: renders the sign-in / create-account form until
 * `auth.user` is set, then the children inside `[data-app-ready]`. The data-*
 * attributes and input names are the contract verify-site.py uses — keep them.
 *
 * `mode="guest"` (the default for apps whose brief never mentions accounts):
 * no form at all. A silent anonymous account is created for this browser and
 * the app opens straight away; data is still per-user on the server, and the
 * Account view offers to turn the guest into a real login later.
 */
export function AuthGate({ auth, appName, children, mode: authMode = "accounts" }: { auth: Auth; appName: string; children: ReactNode; mode?: AuthMode }) {
  const guestStarted = useRef(false);
  useEffect(() => {
    if (authMode !== "guest" || auth.checking || auth.user || guestStarted.current) return;
    guestStarted.current = true;
    void auth.guest().catch(() => { guestStarted.current = false; });
  }, [authMode, auth.checking, auth.user, auth]);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const reason = readAuthError();
    return reason ? (AUTH_ERROR_TEXT[reason] ?? "Sign-in failed. Please try again.") : null;
  });
  const [busy, setBusy] = useState(false);

  if (auth.checking) return <div className="min-h-screen" data-auth-checking />;
  if (auth.user) return <div data-app-ready>{children}</div>;
  if (authMode === "guest") return <div className="min-h-screen" data-auth-checking />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await auth.login(email, password);
      else {
        if (password !== confirmPassword) throw new Error("Your passwords don’t match.");
        await auth.signup(email, password, name.trim());
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-gate min-h-screen" data-auth-gate>
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="auth-card"
      >
        <div className="auth-form-panel">
          <a className="auth-brand" href="/" aria-label={`${appName} home`}>
            <span className="auth-brand-mark"><ShoppingBag size={18} strokeWidth={2.3} /></span>
            <span>{appName}</span>
          </a>
          <div className="auth-heading">
            <span className="auth-eyebrow"><Sparkles size={13} /> YOUR PERSONAL SHOPPING SPACE</span>
            <h1>{mode === "login" ? "Welcome back." : "Join the good finds."}</h1>
            <p>{mode === "login" ? "Sign in to pick up right where you left off." : "Create an account for a smoother way to shop."}</p>
          </div>

          <div className="auth-mode-switch" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); setError(null); }}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => { setMode("signup"); setError(null); }}>Create account</button>
          </div>

          {mode === "signup" && (
            <label className="auth-field">
              <span>Full name</span>
              <input name="name" type="text" autoComplete="name" required maxLength={100} placeholder="How should we greet you?" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          <label className="auth-field">
            <span>Email address</span>
            <input name="email" type="email" autoComplete="email" required autoFocus maxLength={254} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <span className="auth-password-wrap">
              <input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="auth-show-password" onClick={() => setShowPassword((show) => !show)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </span>
          </label>
          {mode === "signup" && (
            <label className="auth-field">
              <span>Confirm password</span>
              <input name="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} placeholder="Enter your password again" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </label>
          )}
          {mode === "signup" && <p className="auth-password-note">Use at least 8 characters to keep your account secure.</p>}
          {error && <p role="alert" className="auth-error">{error}</p>}
          <Button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={17} />
          </Button>

          {GOOGLE_LOGIN && <div className="auth-google"><span>or continue with</span><GoogleButton /></div>}

          {mode === "login" && (
            <button type="button" className="auth-guest" disabled={busy} onClick={async () => {
              setBusy(true); setError(null);
              try { await auth.guest(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
            }}>Continue as guest</button>
          )}

          <p className="auth-legal">{mode === "login" ? "Your cart and saved items are waiting." : "Your details stay private and are only used to manage your account and orders."}</p>
        </div>
        <aside className="auth-editorial" aria-label="Shopping account benefits">
          <div className="auth-editorial-image" />
          <div className="auth-editorial-shade" />
          <div className="auth-editorial-content">
            <span className="auth-editorial-kicker">A BETTER WAY TO FIND YOUR NEXT FAVORITE</span>
            <h2>Good things<br />look good on you.</h2>
            <p>Make every visit yours. Keep the pieces you love close and your shopping details in one place.</p>
            <ul>
              <li><PackageCheck size={17} /> Track your orders</li>
              <li><Heart size={17} /> Save your wishlist</li>
              <li><KeyRound size={17} /> Check out with ease</li>
            </ul>
          </div>
          <span className="auth-editorial-caption">CURATED FOR EVERYDAY EXTRAORDINARY</span>
        </aside>
      </motion.form>
    </div>
  );
}
