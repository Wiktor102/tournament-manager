export interface Match {
	id: string;
	team1: string;
	team2: string;
	pitchId: 1 | 2;
	score1: number;
	score2: number;
	currentTime?: string;
	status: "scheduled" | "live" | "finished";
}

export interface MatchData {
	homeTeam: string;
	awayTeam: string;
	date: string;
	pitchId: 1 | 2;
	[key: string]: unknown;
}

export interface MatchUpdate {
	scoreHome?: number;
	scoreAway?: number;
	status?: "scheduled" | "live" | "finished";
	currentTime?: string;
	isLive?: boolean;
}
