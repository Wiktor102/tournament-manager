"use client";

import { useEffect, useState } from "react";
import useLiveMatch from "@/lib/hooks/useLiveMatch";
import { Match } from "@/types/types";
import { getSetWins } from "@/lib/matchUtils";
import Image from "next/image";

// styles
import "./StreamOverlayWidget.scss";

// Empty match placeholder to use when no match exists yet
const EMPTY_MATCH_PLACEHOLDER: Match = {
	id: "placeholder",
	team1: "",
	team2: "",
	status: "scheduled",
	rank: "1/16",
	format: "twoSetsTo11",
	sets: [
		{ setNumber: 1, targetPoints: 11, team1Points: 0, team2Points: 0, isTieBreak: false },
		{ setNumber: 2, targetPoints: 11, team1Points: 0, team2Points: 0, isTieBreak: false }
	],
	currentSet: 0,
	servingTeam: "team1",
	decidedByTotalPoints: false
};

interface StreamOverlayWidgetProps {
	initialMatch?: Match;
	isCurrent?: boolean;
	noMatchAvailable?: boolean;
}

function StreamOverlayWidget({ initialMatch, isCurrent = false, noMatchAvailable = false }: StreamOverlayWidgetProps) {
	// Handle the case where no match is available but we want to listen for one
	const matchToUse = noMatchAvailable ? EMPTY_MATCH_PLACEHOLDER : initialMatch!;
	const { match, isDeleted } = useLiveMatch(matchToUse, isCurrent);
	const [hasMatch, setHasMatch] = useState(!noMatchAvailable);

	useEffect(() => {
		if (noMatchAvailable) setHasMatch(match.id !== "placeholder");
	}, [match.id, noMatchAvailable]);

	const isFinished = match.status === "finished";
	const winnerClass = isFinished
		? match.winner === "team1"
			? "winning-team1"
			: match.winner === "team2"
			? "winning-team2"
			: ""
		: "";
	const setWins = getSetWins(match);
	const currentSet = match.sets[match.currentSet] ?? match.sets[match.sets.length - 1];
	const currentSetLabel = currentSet?.isTieBreak ? "Dogrywka" : currentSet ? `Set ${currentSet.setNumber}` : "";

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
			<div className="counter-widget widget no-match-widget">
				<h3>Liga elektronika</h3>
				<span className="no-match-text">brak meczu - przerwa</span>
			</div>
		);
	}

	return (
		<div className={`counter-widget widget ${winnerClass}`}>
			<span
				className={`serve-indicator ${match.servingTeam === "team1" ? "serve-indicator--active" : ""}`}
				aria-label={match.servingTeam === "team1" ? `${match.team1} serwuje` : undefined}
			></span>
			<div className="team-name-container">
				<span className={`team-name ${match.servingTeam === "team1" ? "team-name--serving" : ""}`}>
					{match.team1 || "---"}
				</span>
				<div className="score-sets-container">
					<div className="score-sets" data-label="Sety">
						<span>{setWins.team1}</span>
					</div>
					<div
						className={`score-points-container ${
							currentSet?.isTieBreak ? "score-points-container--tiebreak" : ""
						}`}
						data-label={currentSetLabel}
						data-rank={match.rank}
					>
						<div className="score-points" data-label="Punkty">
							{currentSet?.team1Points ?? 0}
						</div>
						<Image src="/elektronik-logo2.png" alt="Liga elektronika" width={64} height={64} />
						<div className="score-points" data-label="Punkty">
							{currentSet?.team2Points ?? 0}
						</div>
					</div>
					<div className="score-sets" data-label="Sety">
						<span>{setWins.team2}</span>
					</div>
				</div>
				<span className={`team-name ${match.servingTeam === "team2" ? "team-name--serving" : ""}`}>
					{match.team2 || "---"}
				</span>
			</div>
			<span
				className={`serve-indicator ${match.servingTeam === "team2" ? "serve-indicator--active" : ""}`}
				aria-label={match.servingTeam === "team2" ? `${match.team2} serwuje` : undefined}
			></span>
		</div>
	);
}

export default StreamOverlayWidget;
