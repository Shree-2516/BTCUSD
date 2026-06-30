import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import asyncio
from backend.NEWS.services.news_service import NewsService
from backend.utils.logger import logger


async def news_scheduler_loop():
    """
    Background scheduler loop for news pipeline execution.
    Loads refresh interval from env (NEWS_REFRESH_MINUTES, default: 15).
    Runs pipeline using asyncio.to_thread to avoid blocking the FastAPI event loop.
    """
    # Load settings
    refresh_minutes = int(os.getenv("NEWS_REFRESH_MINUTES", "15"))
    logger.info(f"News Scheduler initialized. Running news pipeline every {refresh_minutes} minutes.")
    
    # Run once immediately on startup to seed news and signal data
    logger.info("News Scheduler: Triggering initial news pipeline run on startup...")
    try:
        # Run blocking pipeline code in a separate thread
        await asyncio.to_thread(NewsService.run_pipeline)
        logger.info("News Scheduler: Initial pipeline run complete.")
    except Exception as e:
        logger.error(f"News Scheduler: Initial startup pipeline run failed: {e}")
        
    while True:
        try:
            # Wait for the next interval
            await asyncio.sleep(refresh_minutes * 60)
            logger.info("News Scheduler: Triggering scheduled news pipeline run...")
            
            # Run in worker thread
            await asyncio.to_thread(NewsService.run_pipeline)
            logger.info("News Scheduler: Scheduled pipeline run complete.")
        except asyncio.CancelledError:
            logger.info("News Scheduler: Background task was cancelled.")
            break
        except Exception as e:
            logger.error(f"News Scheduler: Error in scheduled execution loop: {e}")
