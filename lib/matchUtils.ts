import { Match } from "@/types/types";

function getMatchStatus(match: Match): [string, string] {
	switch (match.status) {
		case "scheduled":
			return ["Zaplanowany", "background"];
		case "live":
			return ["LIVE", "button-live-score"];
		case "half-time":
			return ["Przerwa", "link-hover"];
		case "penalties":
			return ["Rzuty karne", "button-live-score"];
		case "finished":
			return ["Zakończony", "background"];
	}
}

export { getMatchStatus };
