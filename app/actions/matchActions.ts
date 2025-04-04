"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import { Match, InitialMatchData } from "../../types/types";
import { sendMatchDeleteUpdate, sendMatchUpdate } from "@/app/lib/connectionsStore";

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
	"use server";
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

async function updateMatchInFile(id: string, update: Partial<Match>): Promise<Match> {
	const matches = await readMatchesFromFile();
	const index = matches.findIndex(match => match.id === id);
	const updatedMatch = { ...matches[index], ...update };
	matches[index] = updatedMatch;
	await fs.writeFile(dataFilePath, JSON.stringify(matches, null, 2));

	revalidatePath("/admin");
	revalidatePath(`/match/${id}`);
	revalidatePath("/match/current"); // Add revalidation for current path

	sendMatchUpdate(id, updatedMatch, isCurrentMatch);

	return updatedMatch;
}

// ----------------------------
// ----------------------------
// ----------------------------
// Actions
// ----------------------------

// Save matches data
async function saveMatches(matches: Match[]): Promise<void> {
	await ensureDataDir();
	await fs.writeFile(dataFilePath, JSON.stringify(matches, null, 2));
}

// Create a new match
async function createMatch(formData: InitialMatchData): Promise<Match> {
	const matches = await readMatchesFromFile();

	const newMatch: Match = {
		id: uuid(),
		team1: formData.homeTeam.toUpperCase(),
		team2: formData.awayTeam.toUpperCase(),
		mode: formData.mode,
		rank: formData.rank,
		startedAt: Date.now(),

		score1: 0,
		score2: 0,
		status: "scheduled",
		currentTime: "0",
		addedTime: 0
	};

	matches.push(newMatch);
	await saveMatches(matches);
	sendMatchUpdate(newMatch.id, newMatch, isCurrentMatch);

	revalidatePath("/admin");
	revalidatePath("/");
	revalidatePath("/match/current"); // This is the right place for revalidation

	return newMatch;
}

// ----------------------------
// ----------------------------
// ----------------------------
// Updates
// ----------------------------

async function updateMatchTeams(id: string, team1: string, team2: string): Promise<Match> {
	const match = await readMatchFromFile(id);
	if (!match) throw new Error("Match not found");

	const updatedMatch: Partial<Match> = {
		team1: team1.toUpperCase(),
		team2: team2.toUpperCase()
	};

	return await updateMatchInFile(id, updatedMatch);
}

async function startMatch(id: string): Promise<Match> {
	const match = await readMatchFromFile(id);
	if (!match) throw new Error("Match not found");
	if (match.status !== "scheduled") throw new Error("Match must be in the 'scheduled' state to start");

	const update: Partial<Match> = { status: "live", startedAt: Date.now() };
	return await updateMatchInFile(id, update);
}

async function updateMatchScore(id: string, action: { team: "team1" | "team2"; change: number }): Promise<Match> {
	const match = await readMatchFromFile(id);

	if (!match) throw new Error("Match not found");
	const propertyToUpdate = action.team === "team1" ? "score1" : "score2";
	const updatedMatch = await updateMatchInFile(id, { [propertyToUpdate]: match[propertyToUpdate] + action.change });

	return updatedMatch;
}

async function updateMatchAdditionalTime(id: string, addedTime: number): Promise<Match> {
	const match = await readMatchFromFile(id);
	if (!match) throw new Error("Match not found");
	const updatedMatch = await updateMatchInFile(id, { addedTime });
	return updatedMatch;
}

async function endMatch(id: string): Promise<Match> {
	const match = await readMatchFromFile(id);
	if (!match) throw new Error("Match not found");

	const updatedMatch: Partial<Match> = {
		status: "finished",
		endedAt: Date.now()
	};

	return await updateMatchInFile(id, updatedMatch);
}

async function startBreak(id: string): Promise<Match> {
	const match = await readMatchFromFile(id);
	if (!match) throw new Error("Match not found");

	const updatedMatch: Partial<Match> = {
		status: "half-time",
		addedTime: 0
	};

	return await updateMatchInFile(id, updatedMatch);
}

async function resumeFromBreak(id: string): Promise<Match> {
	const match = await readMatchFromFile(id);
	if (!match) throw new Error("Match not found");

	const updatedMatch: Partial<Match> = {
		status: "live",
		resumedAt: Date.now()
	};

	return await updateMatchInFile(id, updatedMatch);
}

// Get the most recent live match
async function getCurrentLiveMatch(): Promise<Match | undefined> {
	const matches = await readMatchesFromFile();

	// Find the most recent match with status "live"
	const liveMatches = matches.filter(match => match.status === "live");

	if (liveMatches.length === 0) {
		return undefined;
	}

	// Sort by startedAt (most recent first) and take the first one
	return liveMatches.sort((a, b) => {
		const timeA = a.startedAt || 0;
		const timeB = b.startedAt || 0;
		return timeB - timeA;
	})[0];
}

// Delete a match
async function deleteMatch(formData: FormData): Promise<void> {
	const matchId = formData.get("matchId")! as string;
	const matches = await readMatchesFromFile();
	const matchToDelete = matches.find(m => m.id === matchId);
	const filteredMatches = matches.filter(match => match.id !== matchId);

	if (filteredMatches.length < matches.length) {
		// First, save the updated matches list
		await saveMatches(filteredMatches);

		// Then notify all connected clients about the deletion
		if (matchToDelete) {
			await sendMatchDeleteUpdate(matchId);
		}

		// Finally, revalidate paths
		revalidatePath("/admin");
		revalidatePath("/");
		revalidatePath("/match/current");
	}
}

export async function startPenalties(matchId: string) {
	try {
		const updated = await updateMatchInFile(matchId, {
			status: "penalties"
		});

		sendMatchUpdate(matchId, updated, isCurrentMatch);
		return { success: true };
	} catch (error) {
		console.error("Error starting penalties:", error);
		return { success: false, error };
	}
}

/** Function to check if a match is the current (most recent live) match*/
async function isCurrentMatch(match: Match): Promise<boolean> {
	const matches = await readMatchesFromFile();
	const liveMatches = matches.filter(
		m => m.status === "live" || match.status === "half-time" || match.status === "penalties"
	);

	if (liveMatches.length === 0) return false;

	// Sort by startedAt (most recent first)
	const sortedMatches = liveMatches.sort((a, b) => {
		const timeA = a.startedAt || 0;
		const timeB = b.startedAt || 0;
		return timeB - timeA;
	});

	// Check if this match is the most recent live match
	return sortedMatches[0].id === match.id;
}

export { readMatchesFromFile as getMatches, readMatchFromFile as getMatch, getCurrentLiveMatch };
export { startMatch, updateMatchScore, updateMatchAdditionalTime, updateMatchTeams, endMatch, startBreak, resumeFromBreak };
export { createMatch, deleteMatch, isCurrentMatch };
