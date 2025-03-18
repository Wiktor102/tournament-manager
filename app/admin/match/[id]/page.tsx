import { getMatch } from "@/app/actions/matchActions";
import LiveScoreUpdater from "@/components/LiveScoreUpdater";
import { notFound } from "next/navigation";
import "./MatchManagerPage.scss";

async function MatchManagerPage({ params }: { params: { id: string } }) {
	const match = await getMatch(params.id);
	if (!match) notFound();

	return (
		<div className="match-manager-page">
			<h1 className="page-title">
				Live Score:{" "}
				<span className="live-score">
					{match.score1} vs {match.score2}
				</span>
			</h1>

			<div className="match-detail-container">
				<div className="match-date">Match Date: xxx</div>

				<div className="match-status">
					Status: <span className="status-value">{match.status}</span>
				</div>

				<LiveScoreUpdater match={match} />
			</div>
		</div>
	);
}

export default MatchManagerPage;
