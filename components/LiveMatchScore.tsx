"use client";

import { Match } from "../types/types";
import { getMatchStatus } from "@/lib/matchUtils";
import useLiveMatch from "@/lib/hooks/useLiveMatch";

interface LiveMatchScoreProps {
	match: Match;
}

export default function LiveMatchScore({ match: initialMatch }: LiveMatchScoreProps) {
	const match = useLiveMatch(initialMatch);
	const [statusText, statusColor] = getMatchStatus(match);

	return (
		<div className="p-6">
			<div className="flex justify-center items-center mb-4">
				<div className="text-center w-1/3">
					<div className="text-xl font-bold mb-2">{match.team1}</div>
				</div>

				<div className="text-center w-1/3">
					<div className="text-4xl font-bold mb-2">
						{match.score1} - {match.score2}
					</div>
					<div className="match-status">
						Status:{" "}
						<span className="status-value" style={{ backgroundColor: `var(--${statusColor})` }}>
							{statusText}
						</span>
					</div>
				</div>

				<div className="text-center w-1/3">
					<div className="text-xl font-bold mb-2">{match.team2}</div>
				</div>
			</div>
		</div>
	);
}
