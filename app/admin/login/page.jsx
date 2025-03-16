"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/authActions";

export default function LoginPage() {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();

	async function handleSubmit(e) {
		e.preventDefault();

		const response = await login(password);

		if (response.ok) {
			router.push("/admin");
			router.refresh();
		} else {
			setError("Invalid password");
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<div className="bg-white p-8 rounded shadow-md w-96">
				<h1 className="text-2xl font-bold mb-6">Admin Login</h1>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label htmlFor="password" className="block mb-2 text-sm font-medium">
							Password
						</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							className="w-full p-2 border rounded"
							required
						/>
					</div>

					<button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
						Login
					</button>
				</form>
			</div>
		</div>
	);
}
