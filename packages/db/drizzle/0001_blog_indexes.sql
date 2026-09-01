CREATE INDEX IF NOT EXISTS "posts_status_published_at_idx" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_post_parent_idx" ON "comments" USING btree ("post_id","parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_tags_tag_id_idx" ON "post_tags" USING btree ("tag_id");
