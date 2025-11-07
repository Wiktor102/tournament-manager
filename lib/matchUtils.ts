import { Match, TeamSide } from "@/types/types";

function getMatchStatus(match: Match): [string, string] {
	switch (match.status) {
		case "scheduled":
			return ["Zaplanowany", "background"];
		case "live":
			return ["LIVE", "button-live-score"];
		case "finished":
			return ["Zakończony", "background"];
		default:
			return ["Nieznany", "background"];
	}
}

function getSetWins(match: Match): Record<TeamSide, number> {
	return match.sets.reduce(
		(acc, set) => {
			if (set.winner) {
				acc[set.winner] += 1;
			}
			return acc;
		},
		{ team1: 0, team2: 0 } as Record<TeamSide, number>
	);
}

function getTotalPoints(match: Match): Record<TeamSide, number> {
	return match.sets.reduce(
		(acc, set) => {
			acc.team1 += set.team1Points;
			acc.team2 += set.team2Points;
			return acc;
		},
		{ team1: 0, team2: 0 }
	);
}

function getCurrentSet(match: Match) {
	return match.sets[match.currentSet];
}

export { getMatchStatus, getSetWins, getTotalPoints, getCurrentSet };
