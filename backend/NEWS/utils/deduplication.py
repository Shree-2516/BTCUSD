import re

class Deduplicator:
    @staticmethod
    def clean_title_for_comparison(title: str) -> str:
        """Helper to convert title to lowercase and remove non-alphanumeric chars."""
        return re.sub(r'[^a-z0-9\s]', '', title.lower()).strip()
        
    @classmethod
    def get_jaccard_similarity(cls, title1: str, title2: str) -> float:
        """Computes Jaccard word similarity between two titles."""
        set1 = set(cls.clean_title_for_comparison(title1).split())
        set2 = set(cls.clean_title_for_comparison(title2).split())
        if not set1 or not set2:
            return 0.0
        return len(set1.intersection(set2)) / len(set1.union(set2))
        
    @classmethod
    def is_duplicate(cls, new_article, existing_articles, threshold=0.7):
        """
        Determines if a new article's title is highly similar to any existing articles.
        new_article: dict or object with 'title' key/attribute
        existing_articles: list of dicts or objects with 'title' key/attribute
        """
        new_title = new_article.get("title") if isinstance(new_article, dict) else getattr(new_article, "title", "")
        if not new_title:
            return False
            
        for art in existing_articles:
            art_title = art.get("title") if isinstance(art, dict) else getattr(art, "title", "")
            if not art_title:
                continue
            if cls.get_jaccard_similarity(new_title, art_title) > threshold:
                return True
        return False
