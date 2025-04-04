export interface Match {
	id: string;
	team1: string;
	team2: string;
	status: "scheduled" | "live" | "half-time" | "finished" | "penalties";
	mode: "1x12" | "2x10";
	rank: string;

	score1: number;
	score2: number;

	startedAt?: number;
	resumedAt?: number;
	endedAt?: number;
	currentTime?: string;
	addedTime: number;
}

export interface InitialMatchData {
	homeTeam: string;
	awayTeam: string;
	rank: string;
	mode: "1x12" | "2x10";
}

export interface MatchUpdate {
	scoreHome?: number;
	scoreAway?: number;
	status?: "scheduled" | "live" | "penalties" | "finished";
	currentTime?: string;
	isLive?: boolean;
}
