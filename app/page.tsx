import Link from "next/link";

function Home() {
	return (
		<>
			<h1>Main page</h1>
			<Link href="/admin">Panel Administratorski</Link>
		</>
	);
}

export default Home;
