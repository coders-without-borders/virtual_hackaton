CREATE TABLE IF NOT EXISTS `votes` (
	`username` TEXT NOT NULL,
	`repo` TEXT NOT NULL,
	`votes` INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (username, repo)
);

INSERT INTO votes(username, repo) VALUES ('torch', 'torch7');
INSERT INTO votes(username, repo) VALUES ('rust-lang', 'rust');
INSERT INTO votes(username, repo) VALUES ('mongodb', 'mongo');
INSERT INTO votes(username, repo) VALUES ('KhronosGroup', 'SPIRV-LLVM');
INSERT INTO votes(username, repo) VALUES ('Itseez', 'opencv');
