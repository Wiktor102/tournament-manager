import { getMatch } from "@/app/actions/matchActions";
import { notFound } from "next/navigation";
import "./MatchManagerPage.scss";
import { getMatchStatus } from "@/lib/matchUtils";
import LiveScoreUpdater from "@/components/ScoreUpdater/ScoreUpdater";
import MatchTimer from "@/components/MatchTimer";
import ExtraTimeUpdater from "@/components/ExtraTimeUpdater/ExtraTimeUpdater";
import EndMatchButton from "@/components/EndMatchButton/EndMatchButton";
import BreakButton from "@/components/BreakButton/BreakButton";

async function MatchManagerPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const match = await getMatch(id);
	if (!match) notFound();

	const [matchStatus, statusColor] = getMatchStatus(match);

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

				{match.status === "live" && (
					<div className="match-time">
						Czas:{" "}
						<span className="time-value" suppressHydrationWarning>
							<MatchTimer match={match} />
						</span>
					</div>
				)}

				<ExtraTimeUpdater match={match} />
				<LiveScoreUpdater match={match} />

				<div className="buttons">
					{!match.resumedAt && match.mode === "2x10" && <BreakButton match={match} />}
					{match.status === "live" && (match.resumedAt || match.mode === "1x15") && (
						<EndMatchButton match={match} />
					)}
				</div>
			</div>
		</div>
	);
}

export default MatchManagerPage;
