export type TeamSide = "team1" | "team2";

export type MatchStatus = "scheduled" | "live" | "finished";

export type TournamentRank = "1/16" | "1/8" | "1/4" | "1/2" | "Finał" | "O 3 miejsce";

export type MatchFormat = "twoSetsTo11" | "bestOfThreeTo15";

export interface VolleyballSet {
	setNumber: number;
	targetPoints: number;
	team1Points: number;
	team2Points: number;
	winner?: TeamSide;
	isTieBreak?: boolean;
	endedAt?: number;
}

export interface Match {
	id: string;
	team1: string;
	team2: string;
	status: MatchStatus;
	rank: TournamentRank;
	format: MatchFormat;
	sets: VolleyballSet[];
	currentSet: number;
	servingTeam: TeamSide;
	startedAt?: number;
	endedAt?: number;
	winner?: TeamSide;
	decidedByTotalPoints?: boolean;
}

export interface InitialMatchData {
	homeTeam: string;
	awayTeam: string;
	rank: TournamentRank;
	servingTeam: TeamSide;
}

export interface SetScoreUpdate {
	team: TeamSide;
	change: 1 | -1;
	setIndex: number;
}
