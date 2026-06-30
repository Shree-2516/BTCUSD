import re
import html

class TextCleaner:
    @staticmethod
    def clean(text: str) -> str:
        """
        Cleans HTML elements, unescapes characters, and normalizes whitespaces.
        Returns a cleaned, normalized string.
        """
        if not text:
            return ""
        # Unescape HTML entities (e.g. &amp;, &lt;, &gt;, &#39;)
        text = html.unescape(text)
        # Strip HTML tags
        text = re.sub(r'<[^>]*>', ' ', text)
        # Remove extra whitespace/newlines/carriage returns
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
