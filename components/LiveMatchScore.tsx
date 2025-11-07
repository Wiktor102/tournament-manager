"use client";

import { Match } from "../types/types";
import { getMatchStatus, getSetWins } from "@/lib/matchUtils";
import useLiveMatch from "@/lib/hooks/useLiveMatch";

interface LiveMatchScoreProps {
	match: Match;
}

export default function LiveMatchScore({ match: initialMatch }: LiveMatchScoreProps) {
	const { match } = useLiveMatch(initialMatch);
	const [statusText, statusColor] = getMatchStatus(match);
	const setWins = getSetWins(match);
	const currentSet = match.sets[match.currentSet] ?? match.sets[match.sets.length - 1];
	const currentSetLabel = currentSet?.isTieBreak
		? "Dogrywka"
		: currentSet
		? `Set ${currentSet.setNumber}`
		: "Aktualny set";

	return (
		<div className="p-6">
			<div className="flex justify-center items-center mb-4 gap-6">
				<div className="text-center w-1/3">
					<div className="text-xl font-bold mb-2 uppercase tracking-wide">{match.team1}</div>
					<div className="text-3xl font-bold">
						{setWins.team1}
						<span className="text-base font-normal ml-2">sety</span>
					</div>
				</div>

				<div className="text-center w-1/3">
					<div className="text-4xl font-bold mb-2">
						{currentSet?.team1Points ?? 0} - {currentSet?.team2Points ?? 0}
					</div>
					<div className="text-sm uppercase tracking-wider text-gray-300 mb-2">{currentSetLabel}</div>
					<div className="match-status">
						Status:{" "}
						<span className="status-value" style={{ backgroundColor: `var(--${statusColor})` }}>
							{statusText}
						</span>
					</div>
				</div>

				<div className="text-center w-1/3">
					<div className="text-xl font-bold mb-2 uppercase tracking-wide">{match.team2}</div>
					<div className="text-3xl font-bold">
						{setWins.team2}
						<span className="text-base font-normal ml-2">sety</span>
					</div>
				</div>
			</div>
		</div>
	);
}
