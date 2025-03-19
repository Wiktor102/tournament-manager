"use client";

import useLiveMatch from "@/lib/hooks/useLiveMatch";
import { Match } from "@/types/types";
import MatchTimer from "@/components/MatchTimer";

// styles
import "./StreamOverlayWidget.scss";

function StreamOverlayWidget({ initialMatch }: { initialMatch: Match }) {
	const match = useLiveMatch(initialMatch);

	return (
		<>
			<h3>Liga elektronika: {match.rank ?? "1/?"}</h3>
			<div className="counter-widget widget">
				<span className="team-name">{match.team1}</span>
				<span className="score">
					{match.score1} : {match.score2}
				</span>
				<span className="team-name">{match.team2}</span>
			</div>
			<div className="timer-widget widget">
				<MatchTimer match={match} />
			</div>
		</>
	);
}

export default StreamOverlayWidget;
