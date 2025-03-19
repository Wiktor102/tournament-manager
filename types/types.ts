export interface Match {
	id: string;
	team1: string;
	team2: string;
	status: "scheduled" | "live" | "half-time" | "finished";
	mode: "1x15" | "2x10";
	pitchId: 1 | 2;

	score1: number;
	score2: number;

	startedAt?: number;
	resumedAt?: number;
	currentTime?: string;
	addedTime: number;
}

export interface MatchData {
	homeTeam: string;
	awayTeam: string;
	date: string;
	pitchId: 1 | 2;
	status: "scheduled" | "live";
}

export interface MatchUpdate {
	scoreHome?: number;
	scoreAway?: number;
	status?: "scheduled" | "live" | "finished";
	currentTime?: string;
	isLive?: boolean;
}
