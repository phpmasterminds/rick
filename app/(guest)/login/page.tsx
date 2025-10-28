'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Cookies from "js-cookie"; 

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // ✅ for spinner


	// ✅ Redirect to dashboard if already logged in
	useEffect(() => {
		
		const token = localStorage.getItem("token");
		if (token) {
		router.replace("/dashboard");
		}
	}, [router]);
	
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Logging in...");
	    setLoading(true); // start loading

    try {
      const payload = {
        username,
        password,
        grant_type: "password",
      };

      const res = await axios.post("/api/auth/login", payload);
		
      localStorage.setItem("token", JSON.stringify(res.data));
	  
	  /*Get User Details*/
	  const aUserDetails = await axios.get("/api/auth/mine");
	  localStorage.setItem("user", JSON.stringify(aUserDetails.data));
	  
	  Cookies.set("user_id", aUserDetails.data.user_id, { expires: 1 }); 

      setMessage("Login successful!");
	  
      if (res.status === 200) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Login failed");
    }
	finally {
      setLoading(false); // stop loading
    }
  };

	


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-teal-600">Welcome Back</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email" 
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)} // ✅ correct setter
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit" disabled={loading}
			className={`w-full flex justify-center items-center bg-teal-600 text-white py-3 rounded-lg transition-colors ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:bg-teal-700"
            }`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don’t have an account?{" "}
          <Link href="/register" className="text-teal-600 hover:underline">
            Register
          </Link>
        </p>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
}
