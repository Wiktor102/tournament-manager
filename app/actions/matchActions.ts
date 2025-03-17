"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { Match, MatchData, MatchUpdate } from "../../types/types";

const dataFilePath = path.join(process.cwd(), "data", "matches.json");

// Ensure data directory exists
async function ensureDataDir() {
	const dataDir = path.join(process.cwd(), "data");
	try {
		await fs.access(dataDir);
	} catch {
		await fs.mkdir(dataDir, { recursive: true });
	}
}

async function readMatchesFromFile(): Promise<Match[]> {
	try {
		const data = await fs.readFile(dataFilePath, "utf8");
		return JSON.parse(data);
	} catch {
		// If file doesn't exist yet, return empty array
		return [];
	}
}

async function readMatchFromFile(id: string): Promise<Match | undefined> {
	const matches = await readMatchesFromFile();
	return matches.find(match => match.id === id);
}

// Save matches data
async function saveMatches(matches: Match[]): Promise<void> {
	await ensureDataDir();
	await fs.writeFile(dataFilePath, JSON.stringify(matches, null, 2));
}

// Create a new match
async function createMatch(formData: MatchData): Promise<Match> {
	const matches = await readMatchesFromFile();

	const newMatch: Match = {
		id: Date.now().toString(),
		team1: formData.homeTeam.toUpperCase(),
		team2: formData.awayTeam.toUpperCase(),
		score1: 0,
		score2: 0,
		pitchId: formData.pitchId,
		status: "scheduled",
		currentTime: "0"
	};

	matches.push(newMatch);
	await saveMatches(matches);
	revalidatePath("/admin");
	revalidatePath("/");

	return newMatch;
}

// Update a match
async function updateMatch(id: string, formData: MatchData): Promise<Match> {
	const matches = await readMatchesFromFile();
	const match = await readMatchFromFile(id);

	if (!match) {
		throw new Error("Match not found");
	}

	const updatedMatch: Match = {
		...match,
		team1: formData.homeTeam.toUpperCase(),
		team2: formData.awayTeam.toUpperCase(),
		pitchId: formData.pitchId
	};

	const index = matches.findIndex(m => m.id === id);
	matches[index] = updatedMatch;

	await saveMatches(matches);
	revalidatePath("/admin");
	revalidatePath(`/match/${id}`);
	revalidatePath("/");

	return updatedMatch;
}

// Update match score
async function updateMatchScore(id: string, scoreData: MatchUpdate): Promise<Match> {
	const matches = await readMatchesFromFile();
	const match = await readMatchFromFile(id);

	if (!match) {
		throw new Error("Match not found");
	}

	const updatedMatch: Match = {
		...match,
		score1: scoreData.scoreHome !== undefined ? scoreData.scoreHome : match.score1,
		score2: scoreData.scoreAway !== undefined ? scoreData.scoreAway : match.score2,
		currentTime: scoreData.currentTime !== undefined ? scoreData.currentTime : match.currentTime,
		status: scoreData.status !== undefined ? scoreData.status : match.status
	};

	const index = matches.findIndex(m => m.id === id);
	matches[index] = updatedMatch;

	await saveMatches(matches);
	revalidatePath("/admin");
	revalidatePath(`/match/${id}`);
	revalidatePath("/");

	return updatedMatch;
}

// Delete a match
async function deleteMatch(id: string): Promise<boolean> {
	const matches = await readMatchesFromFile();
	const filteredMatches = matches.filter(match => match.id !== id);

	if (filteredMatches.length < matches.length) {
		await saveMatches(filteredMatches);
		revalidatePath("/admin");
		revalidatePath("/");
		return true;
	}

	return false;
}

export { readMatchesFromFile as getMatches, readMatchFromFile as getMatch };
export { createMatch, updateMatch, updateMatchScore, deleteMatch };
