"use server";

import { Match } from "@/types/types";
import Link from "next/link";
import DeleteMatch from "./DeleteMatch";

function MatchesList({ matches }: { matches: Match[] }) {
	if (matches.length == 0) return <p className="empty-state">Brak meczów</p>;
	matches.reverse();

	return (
		<ul>
			{matches.map(match => (
				<li key={match.id} className="match-item">
					<div>
						<div className="match-rank">{match.rank}</div>
						<div className="match-teams">
							{match.team1} vs {match.team2}
						</div>
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
						<Link href={`/match/${match.id}`} className="live-score-button">
							Wynik LIVE
						</Link>
						<Link href={`/admin/match/${match.id}`} className="edit-button">
							Zarządzaj
						</Link>
						<DeleteMatch id={match.id} />
					</div>
				</li>
			))}
		</ul>
	);
}

export default MatchesList;
