-- Every deploy empties the cache, so the manual CACHE_EPOCH override never did anything the deploy didn't.
DROP INDEX answer_cache_scan;
ALTER TABLE answer_cache DROP COLUMN epoch;
CREATE INDEX answer_cache_scan ON answer_cache (locale, created_at);
