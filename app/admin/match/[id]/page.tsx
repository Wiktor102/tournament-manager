import { getMatch } from "@/app/actions/matchActions";
import { notFound } from "next/navigation";
import "./MatchManagerPage.scss";
import { getMatchStatus, getSetWins, getTotalPoints } from "@/lib/matchUtils";
import ScoreUpdater from "@/components/ScoreUpdater/ScoreUpdater";
import EndMatchButton from "@/components/EndMatchButton/EndMatchButton";
import StartMatchButton from "@/components/StartMatchButton/StartMatchButton";

async function MatchManagerPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const match = await getMatch(id);
	if (!match) notFound();

	const [matchStatus, statusColor] = getMatchStatus(match);
	const setWins = getSetWins(match);
	const totalPoints = getTotalPoints(match);
	const formatLabel =
		match.format === "twoSetsTo11"
			? "2 sety do 11 pkt (dogrywka na przewagi przy remisie punktowym)"
			: "Do 2 wygranych setów po 15 pkt";
	const winnerName = match.winner === "team1" ? match.team1 : match.winner === "team2" ? match.team2 : undefined;

	return (
		<div className="match-manager-page">
			<h1 className="page-title">
				Obecny pojedynek:{" "}
				<span className="live-score">
					{match.team1} vs {match.team2}
				</span>
			</h1>

			<div className="match-detail-container">
				<div className="match-status">
					Status:{" "}
					<span className="status-value" style={{ backgroundColor: `var(--${statusColor})` }}>
						{matchStatus}
					</span>
				</div>

				<div className="match-meta">
					<span>
						<strong>Ranga:</strong> {match.rank}
					</span>
					<span>
						<strong>Format:</strong> {formatLabel}
					</span>
					<span>
						<strong>Wygrane sety:</strong> {setWins.team1} - {setWins.team2}
					</span>
					<span>
						<strong>Punkty łączne:</strong> {totalPoints.team1} - {totalPoints.team2}
					</span>
				</div>

				{match.status === "finished" && winnerName && (
					<div className="winner-banner">
						Wygrywa {winnerName}
						{match.decidedByTotalPoints ? " (decydują punkty łączne)" : ""}
					</div>
				)}

				<ScoreUpdater match={match} />

				<div className="buttons">
					{match.status === "scheduled" && <StartMatchButton match={match} />}
					{match.status === "live" && <EndMatchButton match={match} />}
				</div>
			</div>
		</div>
	);
}

export default MatchManagerPage;
