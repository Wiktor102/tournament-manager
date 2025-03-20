"use client";

import { useState, useOptimistic, useTransition, MouseEvent } from "react";
import { updateMatchScore } from "@/app/actions/matchActions";
import { Match } from "@/types/types";

// styles
import "./ScoreUpdater.scss";

export default function ScoreUpdater({ match }: { match: Match }) {
	const [realScore, setRealScore] = useState({ team1: match.score1, team2: match.score2 });
	const [, startTransition] = useTransition();
	const [optimisticScore, changeOptimisticScore] = useOptimistic(
		realScore,
		(state, { team, change }: { team: "team1" | "team2"; change: number }) => ({
			...state,
			[team]: state[team] + change
		})
	);

	function handleScoreUpdateClick(e: MouseEvent, team: "team1" | "team2", change: 1 | -1) {
		e.preventDefault();
		if (change === -1) {
			if (!confirm("Czy na pewno chcesz zmniejszyć wynik?")) return;
		}

		startTransition(async () => {
			try {
				const updatedMatch = await updateMatchScore(match.id, { team, change });
				setRealScore({ team1: updatedMatch.score1, team2: updatedMatch.score2 });
				changeOptimisticScore({ team, change });
			} catch (error) {
				console.error("Error updating score:", error);
				setRealScore(realScore);
			}
		});
	}

	return (
		<>
			<form className="score-updater" action="" inert={!["live", "penalties"].includes(match.status)}>
				<div className="manipulate-score">
					<button onClick={e => handleScoreUpdateClick(e, "team1", 1)}>+</button>
					<button onClick={e => handleScoreUpdateClick(e, "team1", -1)}>-</button>
				</div>
				<div className="score">
					<span data-team-name={match.team1}>{optimisticScore.team1}</span>
					<span>:</span>
					<span data-team-name={match.team2}>{optimisticScore.team2}</span>
					{/* {isPending && <span className="loading-indicator">Odświeżanie...</span>} */}
				</div>
				<div className="manipulate-score">
					<button onClick={e => handleScoreUpdateClick(e, "team2", 1)}>+</button>
					<button onClick={e => handleScoreUpdateClick(e, "team2", -1)}>-</button>
				</div>
			</form>
		</>
	);
}
