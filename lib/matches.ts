"use server";

import { Match, MatchData } from "@/types/types";
import fs from "fs/promises";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "matches.json");

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
	const dataDir = path.join(process.cwd(), "data");
	try {
		await fs.access(dataDir);
	} catch {
		await fs.mkdir(dataDir, { recursive: true });
	}
}

// Get all matches
export async function getMatches(): Promise<Match[]> {
	try {
		const data = await fs.readFile(dataFilePath, "utf8");
		return JSON.parse(data);
	} catch {
		// If file doesn't exist yet, return empty array
		return [];
	}
}

// Get single match by ID
export async function getMatch(id: string): Promise<Match | undefined> {
	const matches = await getMatches();
	return matches.find(match => match.id === id);
}

// Save matches data
export async function saveMatches(matches: Match[]): Promise<void> {
	await ensureDataDir();
	await fs.writeFile(dataFilePath, JSON.stringify(matches, null, 2));
}

// Create a new match
export async function createMatch(matchData: MatchData): Promise<Match> {
	const matches = await getMatches();
	const newMatch: Match = {
		id: Date.now().toString(),
		team1: matchData.homeTeam,
		team2: matchData.awayTeam,
		pitchId: matchData.pitchId,
		isLive: false,
		score1: 0,
		score2: 0
	};

	matches.push(newMatch);
	await saveMatches(matches);
	return newMatch;
}

// Update a match
export async function updateMatch(id: string, matchData: Partial<Match>): Promise<Match | null> {
	const matches = await getMatches();
	const index = matches.findIndex(match => match.id === id);

	if (index !== -1) {
		matches[index] = { ...matches[index], ...matchData };
		await saveMatches(matches);
		return matches[index];
	}
	return null;
}

// Delete a match
export async function deleteMatch(id: string): Promise<boolean> {
	const matches = await getMatches();
	const filteredMatches = matches.filter(match => match.id !== id);

	if (filteredMatches.length < matches.length) {
		await saveMatches(filteredMatches);
		return true;
	}
	return false;
}
