import { useQuery } from '@tanstack/react-query';

interface WikipediaSummary {
  title: string;
  extract: string;
  url: string;
}

export function useWikipediaSummary(query: string) {
  return useQuery<WikipediaSummary | null>({
    queryKey: ['wikipedia', query],
    queryFn: async () => {
      if (!query.trim()) return null;

      try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.query?.search?.[0]) {
          return null;
        }

        const pageTitle = searchData.query.search[0].title;
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
        const summaryResponse = await fetch(summaryUrl);
        const summaryData = await summaryResponse.json();

        return {
          title: summaryData.title,
          extract: summaryData.extract,
          url: summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
        };
      } catch (error) {
        console.error('Wikipedia API error:', error);
        throw error;
      }
    },
    enabled: !!query.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
