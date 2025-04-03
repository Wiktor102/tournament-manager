import { getMatch } from "@/app/actions/matchActions";
import { notFound } from "next/navigation";
import "./MatchManagerPage.scss";
import { getMatchStatus } from "@/lib/matchUtils";
import LiveScoreUpdater from "@/components/ScoreUpdater/ScoreUpdater";
import MatchTimer from "@/components/MatchTimer";
import ExtraTimeUpdater from "@/components/ExtraTimeUpdater/ExtraTimeUpdater";
import EndMatchButton from "@/components/EndMatchButton/EndMatchButton";
import BreakButton from "@/components/BreakButton/BreakButton";
import PenaltyButton from "@/components/PenaltyButton/PenaltyButton";
import StartMatchButton from "@/components/StartMatchButton/StartMatchButton";
import SlipCounterButton from "@/components/SlipCounterButton/SlipCounterButton";
import { getSlipCount } from "@/app/actions/slipCounterActions";

async function MatchManagerPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const match = await getMatch(id);
	if (!match) notFound();

	const [matchStatus, statusColor] = getMatchStatus(match);
	const slipCount = await getSlipCount();

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

				<div className="slip-tracker-section">
					<div className="slip-counter-info">
						Obecna liczba poślizgnięć: <strong>{slipCount}</strong>
					</div>
					<SlipCounterButton />
				</div>

				<div className="buttons">
					{match.status === "scheduled" && <StartMatchButton match={match} />}
					{!match.resumedAt && match.mode === "2x10" && <BreakButton match={match} />}
					{match.status === "live" && (match.resumedAt || match.mode === "1x12") && (
						<PenaltyButton match={match} />
					)}
					{["live", "penalties"].includes(match.status) && (match.resumedAt || match.mode === "1x12") && (
						<EndMatchButton match={match} />
					)}
				</div>
			</div>
		</div>
	);
}

export default MatchManagerPage;
