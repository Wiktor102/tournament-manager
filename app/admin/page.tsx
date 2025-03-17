"use client";

import { getMatches, deleteMatch } from "@/lib/matches";
import MatchForm from "@/components/MatchForm/MatchForm";
import Link from "next/link";
import { useState, useEffect } from "react";
import "./AdminPage.scss";
import { Match } from "@/types/types";

export default function AdminPage() {
	const [matches, setMatches] = useState<Match[]>([]);

	useEffect(() => {
		const fetchMatches = async () => {
			const data = await getMatches();
			setMatches(data);
		};

		fetchMatches();
	}, []);

	return (
		<div className="admin-page">
			<h1 className="page-title">Match Management</h1>

			<div className="add-match-container">
				<h2 className="section-title">Add New Match</h2>
				<MatchForm />
			</div>

			<div className="matches-container">
				<h2 className="section-title">All Matches</h2>

				{matches.length === 0 ? (
					<p className="empty-state">No matches have been added yet.</p>
				) : (
					<ul>
						{matches.map(match => (
							<li key={match.id} className="match-item">
								<div>
									<div className="match-teams">
										{match.team1} vs {match.team2}
									</div>
									{match.status == "live" && (
										<div className="match-details">{new Date(match.currentTime!).toLocaleString()}</div>
									)}
									<div className="match-status">
										Status:{" "}
										<span className="status-value">
											{match.status == "live"
												? "LIVE"
												: match.status == "scheduled"
												? "zaplanowany"
												: "zakończony"}
										</span>
									</div>
								</div>

								<div className="actions-container">
									<Link href={`/admin/match/${match.id}`} className="live-score-button">
										Wynik LIVE
									</Link>
									<Link href={`/admin/match/${match.id}/edit`} className="edit-button">
										Zarządzaj
									</Link>
									<form
										action={() => {
											deleteMatch(match.id);
										}}
									>
										<button
											type="submit"
											className="delete-button"
											onClick={e => {
												if (!confirm("Are you sure you want to delete this match?")) {
													e.preventDefault();
												}
											}}
										>
											Usuń
										</button>
									</form>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
