"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveScoreUpdater({ match }) {
	const router = useRouter();
	const [score, setScore] = useState({
		homeScore: match.homeScore,
		awayScore: match.awayScore,
		currentMinute: match.currentMinute,
		status: match.status
	});

	// Submit score update
	const updateScore = async () => {
		try {
			const response = await fetch(`/api/matches/${match.id}/score`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(score)
			});

			if (response.ok) {
				router.refresh();
			}
		} catch (error) {
			console.error("Error updating score:", error);
		}
	};

	// Status change handlers
	const startMatch = () => {
		setScore({ ...score, status: "in-progress", currentMinute: 1 });
	};

	const endMatch = () => {
		setScore({ ...score, status: "finished" });
	};

	// Auto-save on any change
	useEffect(() => {
		// Skip initial render
		if (
			score.homeScore !== match.homeScore ||
			score.awayScore !== match.awayScore ||
			score.currentMinute !== match.currentMinute ||
			score.status !== match.status
		) {
			updateScore();
		}
	}, [score]);

	return (
		<div>
			<div className="flex items-center justify-center text-5xl font-bold my-6">
				<div className="text-center">
					<div className="text-lg mb-2">{match.homeTeam}</div>
					<div className="flex items-center">
						<button
							onClick={() => setScore({ ...score, homeScore: Math.max(0, score.homeScore - 1) })}
							className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
							disabled={score.homeScore <= 0}
						>
							-
						</button>

						<div className="w-16 text-center">{score.homeScore}</div>

						<button
							onClick={() => setScore({ ...score, homeScore: score.homeScore + 1 })}
							className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
						>
							+
						</button>
					</div>
				</div>

				<div className="mx-8">:</div>

				<div className="text-center">
					<div className="text-lg mb-2">{match.awayTeam}</div>
					<div className="flex items-center">
						<button
							onClick={() => setScore({ ...score, awayScore: Math.max(0, score.awayScore - 1) })}
							className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
							disabled={score.awayScore <= 0}
						>
							-
						</button>

						<div className="w-16 text-center">{score.awayScore}</div>

						<button
							onClick={() => setScore({ ...score, awayScore: score.awayScore + 1 })}
							className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
						>
							+
						</button>
					</div>
				</div>
			</div>

			<div className="mt-8">
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
			</div>
		</div>
	);
}
