import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import bgimage from "../assets/bgimg.png";
import logoimg from "../assets/logo.jpeg";
interface LoginFormProps {
  onToggleMode: () => void;
  isSignup: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onToggleMode,
  isSignup,
}) => {
  const { login, signup } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState<"forward" | "backward">(
    "forward"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const transitionClass = "transition-all duration-400 ease-in-out";
  const getAnimClass = (
    isAnimating: boolean,
    direction: "forward" | "backward"
  ) => {
    if (!isAnimating) return "opacity-100 translate-y-0 pointer-events-auto";
    // Animate out: Up on forward (signup), down on backward (signin)
    return `${transitionClass} opacity-0 ${
      direction === "forward" ? "-translate-y-6" : "translate-y-6"
    } pointer-events-none`;
  };
  const handleModeToggle = () => {
    setAnimDirection(isSignup ? "backward" : "forward");
    setIsAnimating(true);
    setTimeout(() => {
      onToggleMode();
      setIsAnimating(false);
    }, 400); // Match transition duration
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let success = false;
      if (isSignup) {
        success = await signup(
          formData.username,
          formData.email,
          formData.password
        );
      } else {
        success = await login(formData.email, formData.password);
      }

      if (!success) {
        setError(
          isSignup ? "Signup failed. Please try again." : "Invalid credentials"
        );
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-800 to-blue-900"
      style={{
        backgroundImage: `url(${bgimage})`, // Correct way to use imported image
        backgroundSize: "cover", // Adjust to cover the entire div
        backgroundPosition: "center", // Center the image
      }}
    >
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 w-full sm:max-w-md max-w-[90%] border border-white/10 overflow-hidden shadow-xl lg:shadow-lg">
        <div className={getAnimClass(isAnimating, animDirection)}>
          {/* <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md border border-white/10"> */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl mx-auto mb-4 flex items-center justify-center ">
              {/* <Lock className="w-8 h-8 text-white" /> */}
              <img
                src={logoimg}
                alt="Logo"
                className="w-16 h-16 absolute rounded-2xl"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              PrivateChat
            </h1>
            <p className="text-white">
              {isSignup ? "Create your private space" : "Welcome back"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {isSignup && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-white/30 border-0 border-white/20 rounded-lg black/40 placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/0 focus:border-transparent"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40 w-5 h-5" />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full pl-10 pr-4 py-3 bg-white/30 border-0 border-white/20 rounded-lg black/40 placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/0 focus:border-transparent"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full pl-10 pr-12 py-3 bg-white/30 border-0 border-white/20 rounded-lg black/40 placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/0 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/40 hover:text-black/40 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pink-500 via-pink-800 to-purple-500 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-black/0 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading
                ? "Loading..."
                : isSignup
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleModeToggle}
              className="text-gray-300 hover:text-white transition-colors"
              type="button"
            >
              {isSignup
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
