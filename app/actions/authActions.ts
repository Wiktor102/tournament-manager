"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

// Hard-coded admin password
// In a real application, this would be stored securely
const ADMIN_PASSWORD = "football123";

// Simple authentication check
const verifyPassword = (password: string): boolean => {
	return password === ADMIN_PASSWORD;
};

const login = async (password: string): Promise<NextResponse<{ success: boolean; error?: string }>> => {
	const isValid = verifyPassword(password);

	if (isValid) {
		(await cookies()).set("admin_authenticated", "true", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 3600, // 1 hour
			path: "/"
		});

		return NextResponse.json({ success: true });
	} else {
		return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
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
