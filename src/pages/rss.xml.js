// Redirect bare /rss.xml to /en/rss.xml
export async function GET() {
	return new Response(null, {
		status: 302,
		headers: { Location: '/en/rss.xml' }
	})
}
