PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE [quotes] ("id" text PRIMARY KEY UNIQUE, "book" text,"text" text,"name" text, timestamp int);
CREATE TABLE [books] (id text PRIMARY KEY UNIQUE,title text,key text, admin_key text);
CREATE INDEX idx_book ON quotes(book);