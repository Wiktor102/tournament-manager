"use client";

import { useState, useOptimistic, useTransition, MouseEvent } from "react";
import { startMatch, updateMatchScore } from "@/app/actions/matchActions";
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
			changeOptimisticScore({ team, change });
			try {
				const updatedMatch = await updateMatchScore(match.id, { team, change });
				setRealScore({ team1: updatedMatch.score1, team2: updatedMatch.score2 });
			} catch (error) {
				console.error("Error updating score:", error);
				setRealScore(realScore);
			}
		});
	}

	return (
		<>
			<form className="score-updater" action="" inert={match.status !== "live"}>
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

			<div className="match-status-actions">
				{match.status == "scheduled" && (
					<button className="green" onClick={() => void startMatch(match.id)}>
						Rozpocznij mecz
					</button>
				)}
				{match.status == "live" && !match.resumedAt && match.mode === "2x10" && (
					<button className="orange">Zakończ I połowę</button>
				)}
			</div>

			{/* <div className="mt-8">
				<div className="mb-4">
					<label className="block text-sm font-medium mb-1">Current Minute</label>
					<div className="flex items-center">
						<input
							type="number"
							value={score.currentMinute}
							onChange={e => setScore({ ...score, currentMinute: parseInt(e.target.value) || 0 })}
							className="w-20 p-2 border rounded mr-2"
							min="0"
							max="120"
							disabled={score.status !== "in-progress"}
						/>
						<span>min</span>
					</div>
				</div>

				<div className="flex space-x-4 mt-6">
					{score.status === "scheduled" && (
						<button
							onClick={startMatch}
							className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
						>
							Start Match
						</button>
					)}

					{score.status === "in-progress" && (
						<button onClick={endMatch} className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700">
							End Match
						</button>
					)}

					<button
						onClick={() => router.push("/admin")}
						className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
					>
						Back to Admin
					</button>
				</div>
			</div> */}
		</>
	);
}
