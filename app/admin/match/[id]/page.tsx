import { getMatch } from "@/app/actions/matchActions";
import { notFound } from "next/navigation";
import "./MatchManagerPage.scss";
import { getMatchStatus } from "@/lib/matchUtils";
import LiveScoreUpdater from "@/components/ScoreUpdater/ScoreUpdater";
import MatchTimer from "@/components/MatchTimer";

async function MatchManagerPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const match = await getMatch(id);
	if (!match) notFound();

	const [matchStatus, statusColor] = getMatchStatus(match);

	return (
		<div className="match-manager-page">
			<h1 className="page-title">
				Zarządzaj pojedynkiem:{" "}
				<span className="live-score">
					{match.team1} vs {match.team2}
				</span>
			</h1>

			<div className="match-detail-container">
				<div className="match-date">Boisko #{match.pitchId}</div>

				<div className="match-status">
					Status:{" "}
					<span className="status-value" style={{ backgroundColor: `var(--${statusColor})` }}>
						{matchStatus}
					</span>
				</div>

				<div className="match-time">
					Czas:{" "}
					<span className="time-value" suppressHydrationWarning>
						<MatchTimer match={match} />
					</span>
				</div>

				<LiveScoreUpdater match={match} />
			</div>
		</div>
	);
}

export default MatchManagerPage;
