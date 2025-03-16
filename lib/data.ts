import { Match, MatchUpdate } from "@/types/types";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const dataFilePath = path.join(process.cwd(), "data", "matches.json");

// Ensure the data directory exists
const ensureDataDir = () => {
	const dataDir = path.join(process.cwd(), "data");
	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true });
	}

	if (!fs.existsSync(dataFilePath)) {
		fs.writeFileSync(dataFilePath, JSON.stringify([]));
	}
};

// Read all matches
export const getMatches = (): Match[] => {
	try {
		ensureDataDir();
		const data = fs.readFileSync(dataFilePath, "utf8");
		return JSON.parse(data);
	} catch (error) {
		console.error("Error reading matches data:", error);
		return [];
	}
};

// Get a single match by ID
export const getMatchById = (id: string): Match | null => {
	const matches = getMatches();
	return matches.find(match => match.id === id) || null;
};

// Create a new match
export const createMatch = (matchData: Omit<Match, "id">): Match => {
	const matches = getMatches();
	const newMatch = {
		...matchData,
		id: uuidv4()
	};

	matches.push(newMatch);
	fs.writeFileSync(dataFilePath, JSON.stringify(matches, null, 2));
	return newMatch;
};

// Update a match
export const updateMatch = (id: string, updates: MatchUpdate): Match | null => {
	const matches = getMatches();
	const matchIndex = matches.findIndex(m => m.id === id);

	if (matchIndex === -1) return null;

	matches[matchIndex] = {
		...matches[matchIndex],
		...updates
	};

	fs.writeFileSync(dataFilePath, JSON.stringify(matches, null, 2));
	return matches[matchIndex];
};

// Delete a match
export const deleteMatch = (id: string): boolean => {
	const matches = getMatches();
	const filteredMatches = matches.filter(match => match.id !== id);

	if (filteredMatches.length === matches.length) {
		return false;
	}

	fs.writeFileSync(dataFilePath, JSON.stringify(filteredMatches, null, 2));
	return true;
};
