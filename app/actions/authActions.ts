"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Hard-coded admin password
// In a real application, this would be stored securely
const ADMIN_PASSWORD = "football123";

// Simple authentication check
const verifyPassword = (password: string): boolean => {
	return password === ADMIN_PASSWORD;
};

const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
	const isValid = verifyPassword(password);

	if (isValid) {
		(await cookies()).set("admin_authenticated", "true", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 48, // 48 hours
			path: "/"
		});

		return { success: true };
	} else {
		return { success: false, error: "Invalid password" };
	}
};

const isLoggedIn = async (): Promise<boolean> => {
	return (await cookies()).has("admin_authenticated");
};

const logout = async (): Promise<never> => {
	(await cookies()).delete("admin_authenticated");
	return redirect("/admin/login");
};

export { login, logout, isLoggedIn };
