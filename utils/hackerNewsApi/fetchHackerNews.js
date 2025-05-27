import axios from "axios";

export const hackerNewsArticles = async (limit = 10) => {
    const newsApi = "https://hacker-news.firebaseio.com/v0/topstories.json"

    try {

        const response = await axios.get(newsApi)

        if (response) {

            const articleIds = response.data.slice(0, limit)

            const articleList = await Promise.all((articleIds.map((id) => axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`))))

            return articleList.map((item) => (
                {
                    title: item.data.title,
                    url: item.data.url
                }
            ))
        }

    }
    catch (error) {
        console.log("Error calling the Y combinator news")
    }
}

