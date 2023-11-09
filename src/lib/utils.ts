export async function delay(ms = 0): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
export function cors(url: string): string {
	return `http://127.0.0.1:2222/${url}`;
}
