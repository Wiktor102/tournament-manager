"use client";
import { deleteMatch } from "@/app/actions/matchActions";

function DeleteMatch({ id }: { id: string }) {
	return (
		<form action={deleteMatch}>
			<input type="hidden" name="matchId" value={id} />
			<button
				type="submit"
				className="delete-button"
				onClick={e => {
					if (!confirm("Are you sure you want to delete this match?")) {
						e.preventDefault();
					}
				}}
			>
				Usuń
			</button>
		</form>
	);
}

export default DeleteMatch;
