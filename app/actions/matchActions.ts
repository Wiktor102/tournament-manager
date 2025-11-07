"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import {
	Match,
	InitialMatchData,
	MatchFormat,
	TournamentRank,
	VolleyballSet,
	SetScoreUpdate,
	SetCountUpdate,
	TeamSide
} from "../../types/types";
import { sendMatchDeleteUpdate, sendMatchUpdate } from "@/app/lib/connectionsStore";

const dataFilePath = path.join(process.cwd(), "data", "matches.json");

const FORMAT_BY_RANK: Record<TournamentRank, MatchFormat> = {
	"1/16": "twoSetsTo11",
	"1/8": "twoSetsTo11",
	"1/4": "twoSetsTo11",
	"1/2": "bestOfThreeTo15",
	Finał: "bestOfThreeTo15",
	"O 3 miejsce": "bestOfThreeTo15"
};

const FORMAT_CONFIG: Record<MatchFormat, { targetPoints: number }> = {
	twoSetsTo11: { targetPoints: 11 },
	bestOfThreeTo15: { targetPoints: 15 }
};
const DEFAULT_RANK: TournamentRank = "1/16";
const TOURNAMENT_RANKS: readonly TournamentRank[] = ["1/16", "1/8", "1/4", "1/2", "Finał", "O 3 miejsce"];

function isTournamentRank(value: unknown): value is TournamentRank {
	return typeof value === "string" && (TOURNAMENT_RANKS as readonly string[]).includes(value);
}

function isMatchFormat(value: unknown): value is MatchFormat {
	return value === "twoSetsTo11" || value === "bestOfThreeTo15";
}

function coerceTeamSide(value: unknown): TeamSide | undefined {
	return value === "team1" ? "team1" : value === "team2" ? "team2" : undefined;
}

function coerceNumber(value: unknown, fallback = 0): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

async function ensureDataDir() {
	const dataDir = path.join(process.cwd(), "data");
	try {
		await fs.access(dataDir);
	} catch {
		await fs.mkdir(dataDir, { recursive: true });
	}
}

function determineFormat(rank: TournamentRank): MatchFormat {
	return FORMAT_BY_RANK[rank] ?? "twoSetsTo11";
}

function getSetConfig(format: MatchFormat, setNumber: number): { targetPoints: number; isTieBreak: boolean } {
	if (format === "twoSetsTo11" && setNumber >= 3) {
		return { targetPoints: FORMAT_CONFIG[format].targetPoints, isTieBreak: true };
	}

	return { targetPoints: FORMAT_CONFIG[format].targetPoints, isTieBreak: false };
}

function createSet(setNumber: number, targetPoints: number, isTieBreak = false): VolleyballSet {
	return {
		setNumber,
		targetPoints,
		team1Points: 0,
		team2Points: 0,
		isTieBreak
	};
}

function createSetForFormat(setNumber: number, format: MatchFormat): VolleyballSet {
	const { targetPoints, isTieBreak } = getSetConfig(format, setNumber);
	return createSet(setNumber, targetPoints, isTieBreak);
}

function createInitialSets(format: MatchFormat): VolleyballSet[] {
	return [createSetForFormat(1, format)];
}

function createNextSet(existingSets: VolleyballSet[], format: MatchFormat): VolleyballSet {
	const nextNumber = (existingSets[existingSets.length - 1]?.setNumber ?? 0) + 1;
	return createSetForFormat(nextNumber, format);
}

function cloneSets(sets: VolleyballSet[]): VolleyballSet[] {
	return sets.map(set => ({ ...set }));
}

function findCurrentSetIndex(sets: VolleyballSet[]): number {
	if (sets.length === 0) return 0;
	const firstOpenSet = sets.findIndex(set => !set.winner);
	return firstOpenSet === -1 ? Math.max(sets.length - 1, 0) : firstOpenSet;
}

function normaliseStatus(status: string | undefined): Match["status"] {
	switch (status) {
		case "live":
		case "finished":
			return status;
		default:
			return "scheduled";
	}
}

function normalizeSetInput(rawSet: unknown, index: number, format: MatchFormat): VolleyballSet {
	if (typeof rawSet !== "object" || rawSet === null) {
		const { targetPoints, isTieBreak } = getSetConfig(format, index + 1);
		return createSet(index + 1, targetPoints, isTieBreak);
	}

	const record = rawSet as Record<string, unknown>;
	const isTieBreak = record.isTieBreak === true;
	const setNumber =
		typeof record.setNumber === "number" && Number.isFinite(record.setNumber) ? record.setNumber : index + 1;
	const defaultConfig = getSetConfig(format, setNumber);
	const targetPoints =
		typeof record.targetPoints === "number" && Number.isFinite(record.targetPoints)
			? record.targetPoints
			: defaultConfig.targetPoints;

	return {
		setNumber,
		targetPoints,
		team1Points: coerceNumber(record.team1Points),
		team2Points: coerceNumber(record.team2Points),
		winner: coerceTeamSide(record.winner),
		isTieBreak: isTieBreak || defaultConfig.isTieBreak,
		endedAt: typeof record.endedAt === "number" ? record.endedAt : undefined
	};
}

function normalizeMatch(raw: unknown): Match {
	if (typeof raw !== "object" || raw === null) {
		const format = determineFormat(DEFAULT_RANK);
		return {
			id: uuid(),
			team1: "",
			team2: "",
			status: "scheduled",
			rank: DEFAULT_RANK,
			format,
			sets: createInitialSets(format),
			currentSet: 0,
			servingTeam: "team1",
			startedAt: undefined,
			endedAt: undefined,
			winner: undefined,
			decidedByTotalPoints: false
		};
	}

	const record = raw as Record<string, unknown>;
	const rank = isTournamentRank(record.rank) ? record.rank : DEFAULT_RANK;
	const format = isMatchFormat(record.format) ? record.format : determineFormat(rank);
	const setsSource = Array.isArray(record.sets) ? record.sets : [];
	const sets = setsSource.length
		? setsSource.map((set, index) => normalizeSetInput(set, index, format))
		: createInitialSets(format);

	const sanitizedSets = sets.length ? sets : createInitialSets(format);

	const match: Match = {
		id: typeof record.id === "string" ? record.id : uuid(),
		team1: typeof record.team1 === "string" ? record.team1.toUpperCase() : "",
		team2: typeof record.team2 === "string" ? record.team2.toUpperCase() : "",
		status: normaliseStatus(typeof record.status === "string" ? record.status : undefined),
		rank,
		format,
		sets: sanitizedSets,
		currentSet: 0,
		servingTeam: coerceTeamSide(record.servingTeam) ?? "team1",
		startedAt: typeof record.startedAt === "number" ? record.startedAt : undefined,
		endedAt: typeof record.endedAt === "number" ? record.endedAt : undefined,
		winner: coerceTeamSide(record.winner),
		decidedByTotalPoints: record.decidedByTotalPoints === true
	};

	const storedCurrentSet = typeof record.currentSet === "number" ? record.currentSet : undefined;
	match.currentSet =
		storedCurrentSet !== undefined
			? Math.min(storedCurrentSet, Math.max(match.sets.length - 1, 0))
			: findCurrentSetIndex(match.sets);

	return match;
}

async function readMatchesFromFile(): Promise<Match[]> {
	try {
		const data = await fs.readFile(dataFilePath, "utf8");
		const parsed = JSON.parse(data) as unknown;
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed.map(entry => normalizeMatch(entry));
	} catch {
		return [];
	}
}

async function readMatchFromFile(id: string): Promise<Match | undefined> {
	const matches = await readMatchesFromFile();
	return matches.find(match => match.id === id);
}

async function saveMatches(matches: Match[]): Promise<void> {
	await ensureDataDir();
	await fs.writeFile(dataFilePath, JSON.stringify(matches, null, 2));
}

async function persistMatch(match: Match, matches?: Match[]): Promise<Match> {
	const snapshot = matches ?? (await readMatchesFromFile());
	const index = snapshot.findIndex(item => item.id === match.id);
	if (index === -1) {
		throw new Error("Match not found");
	}

	snapshot[index] = match;
	await saveMatches(snapshot);

	revalidatePath("/admin");
	revalidatePath(`/match/${match.id}`);
	revalidatePath("/match/current");
	revalidatePath("/");

	await sendMatchUpdate(match.id, match, isCurrentMatch);
	return match;
}

async function createMatch(formData: InitialMatchData): Promise<Match> {
	const matches = await readMatchesFromFile();
	const rank = formData.rank ?? DEFAULT_RANK;
	const format = determineFormat(rank);

	const newMatch: Match = {
		id: uuid(),
		team1: formData.homeTeam.trim().toUpperCase(),
		team2: formData.awayTeam.trim().toUpperCase(),
		status: "scheduled",
		rank,
		format,
		sets: createInitialSets(format),
		currentSet: 0,
		servingTeam: formData.servingTeam,
		startedAt: undefined,
		endedAt: undefined,
		winner: undefined,
		decidedByTotalPoints: false
	};

	matches.push(newMatch);
	await saveMatches(matches);

	revalidatePath("/admin");
	revalidatePath("/");
	revalidatePath("/match/current");

	await sendMatchUpdate(newMatch.id, newMatch, isCurrentMatch);
	return newMatch;
}

async function startMatch(id: string): Promise<Match> {
	const match = await readMatchFromFile(id);
	if (!match) throw new Error("Match not found");
	if (match.status !== "scheduled") throw new Error("Match must be scheduled to start");

	const sets = cloneSets(match.sets);
	const currentSetIndex = findCurrentSetIndex(sets);

	const updated: Match = {
		...match,
		status: "live",
		startedAt: Date.now(),
		sets,
		currentSet: currentSetIndex
	};

	return persistMatch(updated);
}

async function updateSetScore(matchId: string, update: SetScoreUpdate): Promise<Match> {
	const match = await readMatchFromFile(matchId);
	if (!match) throw new Error("Match not found");

	const sets = cloneSets(match.sets);
	const targetSet = sets[update.setIndex];
	if (!targetSet) throw new Error("Set not found");

	const key = update.team === "team1" ? "team1Points" : "team2Points";
	const nextValue = targetSet[key] + update.change;
	targetSet[key] = Math.max(0, nextValue);

	const updatedMatch: Match = {
		...match,
		sets,
		servingTeam: update.change > 0 ? update.team : match.servingTeam,
		currentSet: findCurrentSetIndex(sets)
	};

	return persistMatch(updatedMatch);
}

async function updateSetCount(matchId: string, update: SetCountUpdate): Promise<Match> {
	const match = await readMatchFromFile(matchId);
	if (!match) throw new Error("Match not found");

	const sets = cloneSets(match.sets);
	if (sets.length === 0) {
		sets.push(createSetForFormat(1, match.format));
	}

	if (update.change === 1) {
		const currentIndex = findCurrentSetIndex(sets);
		const now = Date.now();
		const activeSet = (
			sets[currentIndex] ? { ...sets[currentIndex] } : createSetForFormat(currentIndex + 1, match.format)
		) as VolleyballSet;
		sets.splice(currentIndex + 1);
		activeSet.winner = update.team;
		activeSet.endedAt = now;
		sets[currentIndex] = activeSet;

		const nextSet = createNextSet(sets, match.format);
		sets.push(nextSet);

		const updatedMatch: Match = {
			...match,
			sets,
			currentSet: sets.length - 1
		};

		return persistMatch(updatedMatch);
	}

	// change === -1
	while (sets.length > 0 && !sets[sets.length - 1].winner) {
		sets.pop();
	}

	const lastFinishedIndex = [...sets]
		.map((set, index) => ({ set, index }))
		.filter(({ set }) => Boolean(set.winner))
		.pop()?.index;

	if (lastFinishedIndex === undefined) {
		return match;
	}

	const lastFinished = sets[lastFinishedIndex];
	if (lastFinished.winner !== update.team) {
		return match;
	}

	sets[lastFinishedIndex] = {
		...lastFinished,
		winner: undefined,
		endedAt: undefined
	};
	sets.splice(lastFinishedIndex + 1);

	if (sets.length === 0) {
		const fallbackSet = createSetForFormat(1, match.format);
		const updatedMatch: Match = {
			...match,
			sets: [fallbackSet],
			currentSet: 0
		};
		return persistMatch(updatedMatch);
	}

	const currentSetIndex = findCurrentSetIndex(sets);
	const updatedMatch: Match = {
		...match,
		sets,
		currentSet: currentSetIndex
	};

	return persistMatch(updatedMatch);
}

async function setServingTeam(matchId: string, servingTeam: TeamSide): Promise<Match> {
	const match = await readMatchFromFile(matchId);
	if (!match) throw new Error("Match not found");

	const updatedMatch = {
		...match,
		servingTeam
	};

	return persistMatch(updatedMatch);
}

async function endMatch(id: string): Promise<Match> {
	const match = await readMatchFromFile(id);
	if (!match) throw new Error("Match not found");

	const updated: Match = {
		...match,
		status: "finished",
		endedAt: Date.now()
	};

	return persistMatch(updated);
}

async function getCurrentLiveMatch(): Promise<Match | undefined> {
	const matches = await readMatchesFromFile();
	const liveMatches = matches.filter(match => match.status === "live");

	if (liveMatches.length === 0) {
		return undefined;
	}

	return liveMatches.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0];
}

async function deleteMatch(formData: FormData): Promise<void> {
	const matchId = formData.get("matchId")! as string;
	const matches = await readMatchesFromFile();
	const matchToDelete = matches.find(m => m.id === matchId);
	const filteredMatches = matches.filter(match => match.id !== matchId);

	if (filteredMatches.length === matches.length) {
		return;
	}

	await saveMatches(filteredMatches);

	if (matchToDelete) {
		await sendMatchDeleteUpdate(matchId);
	}

	revalidatePath("/admin");
	revalidatePath("/");
	revalidatePath("/match/current");
}

async function isCurrentMatch(match: Match): Promise<boolean> {
	const matches = await readMatchesFromFile();
	const liveMatches = matches.filter(item => item.status === "live");

	if (liveMatches.length === 0) return false;

	liveMatches.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
	return liveMatches[0].id === match.id;
}

export { readMatchesFromFile as getMatches, readMatchFromFile as getMatch, getCurrentLiveMatch };
export { createMatch, startMatch, updateSetScore, updateSetCount, setServingTeam, endMatch, deleteMatch, isCurrentMatch };
