"use client";

import { useEffect, useState } from "react";
import useLiveMatch from "@/lib/hooks/useLiveMatch";
import { Match } from "@/types/types";
import MatchTimer from "@/components/MatchTimer";

// styles
import "./StreamOverlayWidget.scss";

// Empty match placeholder to use when no match exists yet
const EMPTY_MATCH_PLACEHOLDER: Match = {
	id: "placeholder",
	team1: "",
	team2: "",
	score1: 0,
	score2: 0,
	mode: "1x15",
	rank: "1/?",
	status: "scheduled",
	currentTime: "0",
	addedTime: 0
};

function StreamOverlayWidget({
	initialMatch,
	isCurrent = false,
	noMatchAvailable = false
}: {
	initialMatch?: Match;
	isCurrent?: boolean;
	noMatchAvailable?: boolean;
}) {
	// Handle the case where no match is available but we want to listen for one
	const matchToUse = noMatchAvailable ? EMPTY_MATCH_PLACEHOLDER : initialMatch!;
	const { match, isDeleted } = useLiveMatch(matchToUse, isCurrent);
	const [hasMatch, setHasMatch] = useState(!noMatchAvailable);

	useEffect(() => {
		setHasMatch(noMatchAvailable && match.id !== "placeholder");
	}, [match.id, noMatchAvailable]);

	// New: determine if match is finished & the winning team
	const isFinished = match.status === "finished";
	let winnerClass = "";
	if (isFinished) {
		if (match.score1 > match.score2) {
			winnerClass = "winning-team1";
		} else if (match.score2 > match.score1) {
			winnerClass = "winning-team2";
		}
	}

	// Show deleted state if match was deleted and we're not in "current" mode
	if (isDeleted && !isCurrent) {
		return (
			<div className="match-deleted-message">
				<h3>Liga elektronika</h3>
				<p>Mecz został usunięty</p>
				<p className="info-text">Ten mecz nie jest już dostępny.</p>
			</div>
		);
	}

	// Show empty state if no match available
	if ((noMatchAvailable && !hasMatch) || match.id === "placeholder") {
		return (
			<>
				<h3>Liga elektronika</h3>
				<div className="counter-widget widget no-match-widget">
					<span className="no-match-text">brak meczu</span>
				</div>
			</>
		);
	}

	return (
		<>
			<h3>Liga elektronika: {match.rank ?? "1/?"}</h3>
			<div className="counter-widget widget">
				<span className="team-name">{match.team1}</span>
				<span className={`score ${winnerClass}`}>
					{match.score1} : {match.score2}
				</span>
				<span className="team-name">{match.team2}</span>
			</div>
			<div className="timer-widget widget" suppressHydrationWarning>
				{isFinished ? <span className="finished-timer">zakończony</span> : <MatchTimer match={match} />}
			</div>
		</>
	);
}

export default StreamOverlayWidget;
