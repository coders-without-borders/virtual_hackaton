CREATE TABLE IF NOT EXISTS `votes` (
	`idRepo` TEXT NOT NULL PRIMARY KEY,
	`votes` INTEGER NOT NULL
);

INSERT INTO votes(idRepo,votes) VALUES ("https://github.com/torch/torch7", 0 );
INSERT INTO votes(idRepo,votes) VALUES ("https://github.com/rust-lang/rust", 0 );
INSERT INTO votes(idRepo,votes) VALUES ("https://github.com/mongodb/mongo", 0 );
INSERT INTO votes(idRepo,votes) VALUES ("https://github.com/KhronosGroup/SPIRV-LLVM", 0 );
INSERT INTO votes(idRepo,votes) VALUES ("https://github.com/Itseez/opencv", 0 );
