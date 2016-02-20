CREATE TABLE IF NOT EXISTS `votes` (
	`idRepo` TEXT NOT NULL PRIMARY KEY,
	`votes` INTEGER NOT NULL DEFAULT 0
);

INSERT INTO votes(idRepo) VALUES ("https://github.com/torch/torch7");
INSERT INTO votes(idRepo) VALUES ("https://github.com/rust-lang/rust");
INSERT INTO votes(idRepo) VALUES ("https://github.com/mongodb/mongo");
INSERT INTO votes(idRepo) VALUES ("https://github.com/KhronosGroup/SPIRV-LLVM");
INSERT INTO votes(idRepo) VALUES ("https://github.com/Itseez/opencv");
