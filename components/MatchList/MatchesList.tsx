import { deleteMatch, getMatches } from "@/app/actions/matchActions";
import { Match } from "@/types/types";
import Link from "next/link";
import { useEffect, useState } from "react";

function MatchesList() {
	const [matches, setMatches] = useState<Match[]>([]);

	useEffect(() => {
		const fetchMatches = async () => {
			const data = await getMatches();
			setMatches(data);
		};

		fetchMatches();
	}, []);
	if (matches.length == 0) return <p className="empty-state">Brak meczów</p>;

	return (
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
	);
}
