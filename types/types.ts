export interface Match {
	id: string;
	teamHome: string;
	teamAway: string;
	scoreHome: number;
	scoreAway: number;
	status: "scheduled" | "live" | "finished";
	startTime: string; // ISO string
	currentTime?: string; // Game time like "45:00" or "HT"
	isLive: boolean;
}

export interface MatchUpdate {
	scoreHome?: number;
	scoreAway?: number;
	status?: "scheduled" | "live" | "finished";
	currentTime?: string;
	isLive?: boolean;
}
