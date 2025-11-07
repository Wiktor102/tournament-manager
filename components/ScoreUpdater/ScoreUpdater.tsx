"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { setServingTeam, updateSetScore, updateSetCount } from "@/app/actions/matchActions";
import { Match, TeamSide } from "@/types/types";
import { getSetWins } from "@/lib/matchUtils";

// styles
import "./ScoreUpdater.scss";

interface ScoreUpdaterProps {
	match: Match;
}

export default function ScoreUpdater({ match }: ScoreUpdaterProps) {
	const [viewMatch, setViewMatch] = useState(match);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setViewMatch(match);
	}, [match]);

	const setWins = useMemo(() => getSetWins(viewMatch), [viewMatch]);
	const lastFinishedSet = useMemo(() => {
		for (let i = viewMatch.sets.length - 1; i >= 0; i -= 1) {
			const candidate = viewMatch.sets[i];
			if (candidate.winner) {
				return candidate;
			}
		}
		return undefined;
	}, [viewMatch]);
	const removableSets: Record<TeamSide, boolean> = useMemo(
		() => ({
			team1: lastFinishedSet?.winner === "team1",
			team2: lastFinishedSet?.winner === "team2"
		}),
		[lastFinishedSet]
	);

	const applyLocalSetUpdate = (setIndex: number, team: TeamSide, change: 1 | -1) => {
		setViewMatch(prev => {
			const sets = prev.sets.map(set => ({ ...set }));
			const target = sets[setIndex];
			if (!target) {
				return prev;
			}
			const key = team === "team1" ? "team1Points" : "team2Points";
			target[key] = Math.max(0, target[key] + change);
			return { ...prev, sets };
		});
	};

	const handlePointChange = (setIndex: number, team: TeamSide, change: 1 | -1) => {
		const previousState = viewMatch;
		if (change === -1 && !window.confirm("Czy na pewno chcesz zmniejszyć wynik?")) {
			return;
		}

		startTransition(async () => {
			applyLocalSetUpdate(setIndex, team, change);
			try {
				const updated = await updateSetScore(match.id, { setIndex, team, change });
				setViewMatch(updated);
			} catch (error) {
				console.error("Error updating set score:", error);
				setViewMatch(previousState);
			}
		});
	};

	const handleServingTeamChange = (team: TeamSide) => {
		if (viewMatch.servingTeam === team) return;
		const previous = viewMatch.servingTeam;
		startTransition(async () => {
			setViewMatch(prev => ({ ...prev, servingTeam: team }));
			try {
				const updated = await setServingTeam(match.id, team);
				setViewMatch(updated);
			} catch (error) {
				console.error("Error updating serving team:", error);
				setViewMatch(prev => ({ ...prev, servingTeam: previous }));
			}
		});
	};

	const handleSetChange = (team: TeamSide, change: 1 | -1) => {
		if (change === -1 && !removableSets[team]) {
			return;
		}

		if (change === -1 && !window.confirm("Czy na pewno chcesz odjąć set?")) {
			return;
		}

		const snapshot = viewMatch;
		startTransition(async () => {
			try {
				const updated = await updateSetCount(match.id, { team, change });
				setViewMatch(updated);
			} catch (error) {
				console.error("Error updating set count:", error);
				setViewMatch(snapshot);
			}
		});
	};

	return (
		<section className="score-updater" aria-live="polite">
			<div className="score-updater__header">
				<h2>Kontrola punktów</h2>
				<div className="serve-toggle" role="group" aria-label="Zmiana serwującej drużyny">
					<span>Serwuje:</span>
					<div className="serve-toggle__buttons">
						<button
							type="button"
							className={viewMatch.servingTeam === "team1" ? "active" : ""}
							onClick={() => handleServingTeamChange("team1")}
							disabled={isPending}
						>
							{match.team1}
						</button>
						<button
							type="button"
							className={viewMatch.servingTeam === "team2" ? "active" : ""}
							onClick={() => handleServingTeamChange("team2")}
							disabled={isPending}
						>
							{match.team2}
						</button>
					</div>
				</div>
			</div>

			<div className="set-counter" role="group" aria-label="Kontrola liczby wygranych setów">
				<h3>Kontrola setów</h3>
				<div className="set-counter__rows">
					<div className="set-counter__row">
						<span className="set-counter__team">{viewMatch.team1}</span>
						<div className="score-controls set-counter__controls">
							<button type="button" onClick={() => handleSetChange("team1", 1)} disabled={isPending}>
								+
							</button>
							<span>{setWins.team1}</span>
							<button
								type="button"
								onClick={() => handleSetChange("team1", -1)}
								disabled={isPending || !removableSets.team1}
							>
								-
							</button>
						</div>
					</div>
					<div className="set-counter__row">
						<span className="set-counter__team">{viewMatch.team2}</span>
						<div className="score-controls set-counter__controls">
							<button type="button" onClick={() => handleSetChange("team2", 1)} disabled={isPending}>
								+
							</button>
							<span>{setWins.team2}</span>
							<button
								type="button"
								onClick={() => handleSetChange("team2", -1)}
								disabled={isPending || !removableSets.team2}
							>
								-
							</button>
						</div>
					</div>
				</div>
			</div>

			<table className="set-score-table">
				<thead>
					<tr>
						<th>Set</th>
						<th>{match.team1}</th>
						<th>{match.team2}</th>
						<th>Zwycięzca</th>
					</tr>
				</thead>
				<tbody>
					{viewMatch.sets.map((set, index) => {
						const isActive = index === viewMatch.currentSet && viewMatch.status !== "finished";
						const winnerName = set.winner === "team1" ? match.team1 : set.winner === "team2" ? match.team2 : "-";

						return (
							<tr
								key={`${set.setNumber}-${index}`}
								className={`${isActive ? "active" : ""} ${set.isTieBreak ? "tie-break" : ""}`}
							>
								<td>
									Set {set.setNumber}
									{set.isTieBreak ? " (dogrywka)" : ""}
								</td>
								<td>
									<div className="score-controls">
										<button
											type="button"
											onClick={() => handlePointChange(index, "team1", 1)}
											disabled={isPending}
										>
											+
										</button>
										<span>{set.team1Points}</span>
										<button
											type="button"
											onClick={() => handlePointChange(index, "team1", -1)}
											disabled={isPending || set.team1Points === 0}
										>
											-
										</button>
									</div>
								</td>
								<td>
									<div className="score-controls">
										<button
											type="button"
											onClick={() => handlePointChange(index, "team2", 1)}
											disabled={isPending}
										>
											+
										</button>
										<span>{set.team2Points}</span>
										<button
											type="button"
											onClick={() => handlePointChange(index, "team2", -1)}
											disabled={isPending || set.team2Points === 0}
										>
											-
										</button>
									</div>
								</td>
								<td className="set-winner">{winnerName}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			{isPending && <p className="update-indicator">Zapisywanie zmian...</p>}
		</section>
	);
}
