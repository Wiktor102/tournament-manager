"use client";

import "./adminLayout.scss";
import { logout, isLoggedIn } from "../actions/authActions";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }) {
	// const [authenticated, setAuthenticated] = useState(false);

	// useEffect(() => {
	// 	const checkAuth = async () => {
	// 		const authStatus = await isLoggedIn();
	// 		setAuthenticated(authStatus);
	// 	};

	// 	checkAuth();
	// }, []);

	return (
		<div className="admin-layout">
			<header className="admin-header">
				<h1 className="header-title">Tournament Admin</h1>
				<nav>
					<ul className="nav-list">
						<li>
							<a href="/admin" className="nav-link">
								Matches
							</a>
						</li>
						<li>
							<a href="/" className="nav-link">
								View Site
							</a>
						</li>
						{/* {false && (
							<li>
								<form action={logout}>
									<button type="submit" className="nav-link nav-button">
										Logout
									</button>
								</form>
							</li>
						)} */}
					</ul>
				</nav>
			</header>
			<main className="main-content">
				<div className="content-container">{children}</div>
			</main>
		</div>
	);
}
